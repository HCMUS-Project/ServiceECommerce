# Use a Node.js base image
FROM node:20

# Set the working directory in the container
WORKDIR /root/deploy/datn/ServiceECommerce

# Copy package.json and package-lock.json
COPY . .

# Install dependencies
RUN yarn install

# Gen proto
RUN yarn gen:proto_folder
RUN yarn gen:proto

# # Migrate db
# RUN migrate_name="merge_db_from_new_pull" yarn migrate 
# RUN yarn generate

# Creates a "dist" folder with the production build
RUN yarn build

# Expose the port your app runs on
EXPOSE 3002

# Copy entrypoint script and grant execution permissions
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

# Set entrypoint script to run when the container starts
ENTRYPOINT ["entrypoint.sh"]
CMD ["yarn", "start"]