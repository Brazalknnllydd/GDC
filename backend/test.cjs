const http = require('http');

async function test() {
  const loginData = JSON.stringify({ username: 'cashier', password: 'cashier123' });
  const loginRes = await fetch('http://localhost:5000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: loginData
  });
  const loginJson = await loginRes.json();
  const token = loginJson.token;

  const data = JSON.stringify({
    amountPaid: 290,
    changeAmount: 0,
    customerId: null,
    discountAmount: 0,
    items: [{
      price: 290,
      productId: 16,
      quantity: 1,
      subtotal: 290
    }],
    paymentMethod: 'Cash',
    receiptNumber: 'QF-test12345678',
    shiftId: null,
    subtotal: 290,
    totalAmount: 290,
    status: 'completed'
  });

  const res = await fetch('http://localhost:5000/sales', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: data
  });
  
  const text = await res.text();
  console.log('STATUS:', res.status, 'BODY:', text);
}

test();
