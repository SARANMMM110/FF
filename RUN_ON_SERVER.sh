#!/bin/bash

echo "🔧 Adding 'repeat' column to tasks table..."
echo ""

# Run the SQL directly
mysql -u frankimsocial_ff -p'prR03@gJbDFLhF$$' frankimsocial_ff <<EOF
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS \`repeat\` TEXT DEFAULT 'none';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_detail TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_recurring_task_id INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS next_occurrence_date DATE;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Columns added successfully!"
    echo ""
    echo "Verifying columns exist:"
    mysql -u frankimsocial_ff -p'prR03@gJbDFLhF$$' frankimsocial_ff -e "DESCRIBE tasks;" | grep -E "repeat|next_occurrence"
    echo ""
    echo "✅ Done! Now restart the backend:"
    echo "   pm2 restart focusflow-backend"
else
    echo ""
    echo "❌ Error adding columns. Check the error message above."
    exit 1
fi

