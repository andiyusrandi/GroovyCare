const midtransClient = require('midtrans-client');

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: 'SB-Mid-server-VUMaZt15LtvfK6iSvE1FsTXT',
  clientKey: 'SB-Mid-client-hBxSv5Azplr7BwJ0'
});

const parameter = {
  transaction_details: {
    order_id: 'TEST-' + Date.now(),
    gross_amount: 10000
  }
};

snap.createTransaction(parameter)
  .then((transaction) => {
    console.log('Success!', transaction);
  })
  .catch((err) => {
    console.error('Error:', err.message);
  });
