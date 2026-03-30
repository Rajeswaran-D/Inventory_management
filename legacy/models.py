from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    address = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sales = db.relationship('Sale', backref='customer', lazy=True)

class Envelope(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    size = db.Column(db.String(50), nullable=False)
    material_type = db.Column(db.String(20), nullable=False)  # MP, Buff, K, Premium
    gsm = db.Column(db.Integer, nullable=False)
    color = db.Column(db.String(20))
    price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Integer, default=0)
    low_stock_threshold = db.Column(db.Integer, default=100)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    payment_status = db.Column(db.String(20), default='Paid')  # Paid, Pending
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship('SaleItem', backref='sale', lazy=True)

class SaleItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sale.id'), nullable=False)
    envelope_id = db.Column(db.Integer, db.ForeignKey('envelope.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    envelope = db.relationship('Envelope')

class StockTransaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    envelope_id = db.Column(db.Integer, db.ForeignKey('envelope.id'), nullable=False)
    type = db.Column(db.String(10), nullable=False)  # 'IN' or 'OUT'
    quantity = db.Column(db.Integer, nullable=False)
    note = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    envelope = db.relationship('Envelope')
