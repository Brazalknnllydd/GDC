const http = require('http');

const data = JSON.stringify({
  amountPaid: 290,
  changeAmount: 0,
  customerId: null,
  discountAmount: 0,
  items: [{
    price: 290,
    productId: 3,
    quantity: 1,
    subtotal: 290
  }],
  paymentMethod: 'Cash',
  receiptNumber: 'QF-test12345',
  shiftId: null,
  subtotal: 290,
  totalAmount: 290,
  status: 'completed'
});

const req = http.request('http://localhost:5000/sales', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
});

req.on('error', console.error);
req.write(data);
req.end();
