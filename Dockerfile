# Use the specified Node.js base image
FROM node:20

# Install required tools
RUN apt-get update && \
    apt-get install -y imagemagick zbar-tools poppler-utils pdftk curl && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install any dependencies
RUN npm install

# Copy the project files into the container
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "src/pdfact.js"]
