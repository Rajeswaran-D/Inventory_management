from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from models import db, Customer, Envelope, Sale, SaleItem, StockTransaction
from datetime import datetime, timedelta
import pandas as pd
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///inventory.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app)
db.init_app(app)

# Helper for Marshmallow schema could be here, but let's just make quick dict mappers

def envelope_to_dict(e):
    return {
        'id': e.id, 'size': e.size, 'material_type': e.material_type,
        'gsm': e.gsm, 'color': e.color, 'price': e.price,
        'quantity': e.quantity, 'low_stock_threshold': e.low_stock_threshold
    }

def customer_to_dict(c):
    return {
        'id': c.id, 'name': c.name, 'phone': c.phone, 'address': c.address,
        'created_at': c.created_at.strftime('%Y-%m-%d')
    }

def sale_to_dict(s):
    return {
        'id': s.id, 'customer': s.customer.name, 'total_amount': s.total_amount,
        'payment_status': s.payment_status, 'created_at': s.created_at.strftime('%Y-%m-%d %H:%M'),
        'items': [{
            'id': i.id, 'envelope_id': i.envelope_id, 'size': i.envelope.size,
            'quantity': i.quantity, 'unit_price': i.unit_price, 'total_price': i.total_price
        } for i in s.items]
    }

# ROUTES

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_stats():
    total_stock = db.session.query(db.func.sum(Envelope.quantity)).scalar() or 0
    today = datetime.utcnow().date()
    today_sales = db.session.query(db.func.sum(Sale.total_amount)).filter(db.func.date(Sale.created_at) == today).scalar() or 0
    low_stock_count = Envelope.query.filter(Envelope.quantity <= Envelope.low_stock_threshold).count()
    
    # Simple sales trend (last 7 days)
    sales_trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        amt = db.session.query(db.func.sum(Sale.total_amount)).filter(db.func.date(Sale.created_at) == day).scalar() or 0
        sales_trend.append({'date': day.strftime('%b %d'), 'amount': amt})

    # Stock distribution by materialType
    stock_dist = {}
    envelopes = Envelope.query.all()
    for e in envelopes:
        stock_dist[e.material_type] = stock_dist.get(e.material_type, 0) + e.quantity
    dist_list = [{'type': k, 'count': v} for k, v in stock_dist.items()]

    # Sales Analytics for insights
    # Business insights: Top-selling Size
    ts_query = db.session.query(Envelope.size, db.func.sum(SaleItem.quantity).label('total')).join(SaleItem).group_by(Envelope.size).order_by(db.text('total DESC')).first()
    top_size = ts_query[0] if ts_query else "N/A"

    # Business insights: Most used GSM
    gsm_query = db.session.query(Envelope.gsm, db.func.sum(SaleItem.quantity).label('total')).join(SaleItem).group_by(Envelope.gsm).order_by(db.text('total DESC')).first()
    top_gsm = gsm_query[0] if gsm_query else "N/A"

    return jsonify({
        'totalStock': total_stock,
        'todaySales': today_sales,
        'lowStockAlerts': low_stock_count,
        'salesTrend': sales_trend,
        'stockDistribution': dist_list,
        'topSize': top_size,
        'topGSM': top_gsm
    })

@app.route('/api/export/reports', methods=['GET'])
def export_reports():
    sales = Sale.query.all()
    data = []
    for s in sales:
        for i in s.items:
            data.append({
                'Sale ID': s.id,
                'Date': s.created_at.strftime('%Y-%m-%d %H:%M'),
                'Customer': s.customer.name,
                'Product': f"{i.envelope.size} ({i.envelope.material_type})",
                'Qty': i.quantity,
                'Unit Price': i.unit_price,
                'Total': i.total_price
            })
    df = pd.DataFrame(data)
    buffer = BytesIO()
    df.to_excel(buffer, index=False, engine='openpyxl')
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name="Swami_Sales_Report.xlsx", mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

@app.route('/api/envelopes', methods=['GET', 'POST'])
def handle_envelopes():
    if request.method == 'POST':
        data = request.json
        # Check for duplicates (same size, material, gsm, color)
        exists = Envelope.query.filter_by(
            size=data['size'], material_type=data['material_type'],
            gsm=data['gsm'], color=data.get('color', '')
        ).first()
        if exists:
            return jsonify({'error': 'Product already exists'}), 400
        
        new_e = Envelope(
            size=data['size'], material_type=data['material_type'],
            gsm=data['gsm'], color=data.get('color', ''),
            price=data['price'], quantity=data.get('quantity', 0),
            low_stock_threshold=data.get('low_stock_threshold', 50)
        )
        db.session.add(new_e)
        db.session.commit()
        return jsonify(envelope_to_dict(new_e)), 201
    
    envelopes = Envelope.query.all()
    return jsonify([envelope_to_dict(e) for e in envelopes])

@app.route('/api/envelopes/<int:id>', methods=['PUT', 'DELETE'])
def handle_envelope(id):
    e = Envelope.query.get_or_404(id)
    if request.method == 'DELETE':
        db.session.delete(e)
        db.session.commit()
        return '', 204
    
    data = request.json
    e.size = data.get('size', e.size)
    e.material_type = data.get('material_type', e.material_type)
    e.gsm = data.get('gsm', e.gsm)
    e.color = data.get('color', e.color)
    e.price = data.get('price', e.price)
    e.quantity = data.get('quantity', e.quantity)
    e.low_stock_threshold = data.get('low_stock_threshold', e.low_stock_threshold)
    db.session.commit()
    return jsonify(envelope_to_dict(e))

@app.route('/api/customers', methods=['GET', 'POST'])
def handle_customers():
    if request.method == 'POST':
        data = request.json
        new_c = Customer(name=data['name'], phone=data['phone'], address=data.get('address', ''))
        db.session.add(new_c)
        db.session.commit()
        return jsonify(customer_to_dict(new_c)), 201
    
    customers = Customer.query.all()
    return jsonify([customer_to_dict(c) for c in customers])

@app.route('/api/sales', methods=['GET', 'POST'])
def handle_sales():
    if request.method == 'POST':
        data = request.json
        customer_id = data['customer_id']
        items = data['items']  # list of {envelope_id, quantity, unit_price}
        
        total_amt = 0
        new_sale = Sale(customer_id=customer_id, total_amount=0) # will update after adding items
        db.session.add(new_sale)
        db.session.flush() # get ID

        for item in items:
            env = Envelope.query.get(item['envelope_id'])
            if env.quantity < item['quantity']:
                return jsonify({'error': f"Insufficient stock for {env.size}"}), 400
            
            line_total = item['quantity'] * item['unit_price']
            total_amt += line_total
            sale_item = SaleItem(
                sale_id=new_sale.id, envelope_id=env.id,
                quantity=item['quantity'], unit_price=item['unit_price'],
                total_price=line_total
            )
            db.session.add(sale_item)
            
            # Stock OUT
            env.quantity -= item['quantity']
            db.session.add(StockTransaction(envelope_id=env.id, type='OUT', quantity=item['quantity'], note=f'Sale #{new_sale.id}'))

        new_sale.total_amount = total_amt
        db.session.commit()
        return jsonify(sale_to_dict(new_sale)), 201
    
    sales = Sale.query.order_by(Sale.created_at.desc()).all()
    return jsonify([sale_to_dict(s) for s in sales])

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    data = request.json
    env = Envelope.query.get(data['envelope_id'])
    if data['type'] == 'IN':
        env.quantity += data['quantity']
    else:
        env.quantity -= data['quantity']
    
    t = StockTransaction(
        envelope_id=env.id, type=data['type'], 
        quantity=data['quantity'], note=data.get('note', '')
    )
    db.session.add(t)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/export/invoice/<int:id>', methods=['GET'])
def export_invoice(id):
    sale = Sale.query.get_or_404(id)
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    p.setFont("Helvetica-Bold", 16)
    p.drawString(100, 750, f"SWAMI MANUFACTURING - INVOICE #{sale.id}")
    p.setFont("Helvetica", 12)
    p.drawString(100, 730, f"Date: {sale.created_at.strftime('%Y-%m-%d %H:%M')}")
    p.drawString(100, 715, f"Customer: {sale.customer.name}")
    p.drawString(100, 700, f"Phone: {sale.customer.phone}")
    
    y = 650
    p.drawString(100, y, "Item Description")
    p.drawString(300, y, "Qty")
    p.drawString(350, y, "Price")
    p.drawString(450, y, "Total")
    y -= 20
    p.line(100, y+15, 500, y+15)
    
    for item in sale.items:
        p.drawString(100, y, f"{item.envelope.size} {item.envelope.material_type} - {item.envelope.gsm} GSM")
        p.drawString(300, y, str(item.quantity))
        p.drawString(350, y, f"${item.unit_price}")
        p.drawString(450, y, f"${item.total_price}")
        y -= 20
    
    p.line(100, y+15, 500, y+15)
    p.setFont("Helvetica-Bold", 12)
    p.drawString(400, y-10, f"GRAND TOTAL: ${sale.total_amount}")
    
    p.showPage()
    p.save()
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name=f"Invoice_{sale.id}.pdf", mimetype='application/pdf')

# INIT DB WITH SAMPLE DATA
@app.cli.command("init-db")
def init_db():
    db.create_all()
    # Adding sample envelopes
    if not Envelope.query.first():
        samples = [
            {'size': '4.5x9.5', 'material_type': 'Buff', 'gsm': 80, 'color': 'Brown', 'price': 2.50, 'quantity': 1000},
            {'size': '4.5x9.5', 'material_type': 'MP', 'gsm': 100, 'color': 'White', 'price': 3.20, 'quantity': 500},
            {'size': '9x12', 'material_type': 'Premium', 'gsm': 120, 'color': 'Blue', 'price': 5.50, 'quantity': 200},
            {'size': '5x7', 'material_type': 'K', 'gsm': 90, 'color': 'Yellow', 'price': 1.80, 'quantity': 50},
        ]
        for s in samples:
            db.session.add(Envelope(**s))
        
        # Adding sample customer
        c1 = Customer(name="Local Trading Co.", phone="9876543210", address="Market Road, HQ")
        db.session.add(c1)
        db.session.commit()
    print("Database Initialized!")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
