#!/bin/bash

echo "🔧 Fixing 'repeat' Column Issue"
echo "================================="
echo ""

echo "1. Checking if 'repeat' column exists..."
mysql -u frankimsocial_ff -p'prR03@gJbDFLhF$$' frankimsocial_ff -e "DESCRIBE tasks;" | grep -i repeat
echo ""

echo "2. If column doesn't exist, adding it..."
mysql -u frankimsocial_ff -p'prR03@gJbDFLhF$$' frankimsocial_ff <<EOF
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS \`repeat\` TEXT DEFAULT 'none';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_detail TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_recurring_task_id INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS next_occurrence_date DATE;
EOF

echo ""
echo "3. Verifying columns exist..."
mysql -u frankimsocial_ff -p'prR03@gJbDFLhF$$' frankimsocial_ff -e "DESCRIBE tasks;" | grep -E "repeat|next_occurrence"
echo ""

echo "✅ Done! Now restart the backend:"
echo "   pm2 restart focusflow-backend"

