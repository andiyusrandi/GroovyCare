import re

file_path = "/Users/macbookpro/mamp/GroovyCare/src/app/customer/dashboard/components/CheckoutView.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Replace the Invoice Billing block with empty string
content = re.sub(r'              \{\/\* Invoice Billing \*\/\}[\s\S]*?<\/label>', '', content, count=1)

# Also check for paymentMethod === "INVOICE" anywhere else in the file just in case
content = content.replace('paymentMethod === "INVOICE"', 'false')

with open(file_path, "w") as f:
    f.write(content)

