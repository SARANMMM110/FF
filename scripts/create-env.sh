#!/bin/bash

# Create .env file for production
cat > .env << 'EOF'
DB_TYPE=mysql
DB_HOST=localhost
DB_USER=frankimsocial_ff
DB_PASSWORD=prR03@gJbDFLhF$$
DB_NAME=frankimsocial_ff
DB_PORT=3306
DB_SSL=false
FRONTEND_URL=https://focus.imsocialclub.com
JWT_SECRET=JfTsoj7EvtDHk1B2Recda0XQ6KwlLMSUFxnNVY8mAZgyuGO5z4I3bqp9hirCWP
GOOGLE_OAUTH_CLIENT_ID=378278205772-t4icp3d1tlqc1mthf0vgr75dseeamgcq.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=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
PORT=3000
NODE_ENV=production
STORAGE_PATH=./storage
EOF

echo "✅ .env file created successfully!"

