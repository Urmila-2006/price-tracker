export function formatCurrency(amount: number, currency: string = 'INR'): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch (e) {
    // Fallback if the currency code is somehow invalid
    return `${currency} ${amount.toFixed(2)}`;
  }
}
