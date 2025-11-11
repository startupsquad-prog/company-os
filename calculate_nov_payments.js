const data = require('./nov_payments.json');

const payments = data.items;
const captured = payments.filter(p => p.status === 'captured');
const refunded = captured.filter(p => p.refund_status === 'full' || p.refund_status === 'partial');
const net = captured.filter(p => !p.refund_status || p.refund_status === null);

const totalCaptured = captured.reduce((sum, p) => sum + p.amount, 0);
const totalRefunded = refunded.reduce((sum, p) => sum + (p.amount_refunded || 0), 0);
const netReceived = totalCaptured - totalRefunded;

console.log('=== Payment Summary for November 2025 ===');
console.log('Total Captured:', (totalCaptured/100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }));
console.log('Total Refunded:', (totalRefunded/100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }));
console.log('Net Received:', (netReceived/100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }));
console.log('Successful payments:', captured.length);
console.log('Refunded payments:', refunded.length);

