#############################################
# This script is used to test if the server supports gzip encoding for the html, css and js files
# It is run through helm test
#############################################

#!/bin/bash
set -e

echo $HOST:$PORT

# Fail if grep, gunzip or sort are not installed
command -v grep || { echo 'grep is not installed' ; exit 1; }
command -v gunzip || { echo 'gunzip is not installed' ; exit 1; }
command -v sort || { echo 'sort is not installed' ; exit 1; }

# Fetch the index.html with verbose logging
curl -s -H "Accept-Encoding: gzip" http://$HOST:$PORT -o index.html.gz

# Verify if index.html.gz is a valid gzip file
file index.html.gz

# Unzip the index.html
gunzip index.html.gz

# Verify if index.html is a valid html file
file index.html

# Find all of the js and css files
grep -o -E 'href="[^"]+\.css' index.html | cut -d'"' -f2 > css_files.txt
grep -o -E 'src="[^"]+\.js' index.html | cut -d'"' -f2 > js_files.txt

# Make sure the list is unique
sort -u css_files.txt -o css_files.txt
sort -u js_files.txt -o js_files.txt

# Check if css_files.txt exists and is not empty
if [ -s css_files.txt ]; then
  # Fetch all of the css files with verbose logging
  while read -r line; do
    echo $line
    # Ensure the URL is correct
    if [[ "$line" != http* ]]; then
      line="http://$HOST:$PORT/$line"
    fi
    curl -s -H "Accept-Encoding: gzip" "$line" -o "$(basename "$line").gz"
    gunzip "$(basename "$line").gz"
  done < css_files.txt
else
  echo "Not found any CSS files"
  exit 1
fi

# Check if js_files.txt exists and is not empty
if [ -s js_files.txt ]; then
  # Fetch all of the js files with verbose logging
  while read -r line; do
    echo $line
    # Ensure the URL is correct
    if [[ "$line" != http* ]]; then
      line="http://$HOST:$PORT/$line"
    fi
    curl -s -H "Accept-Encoding: gzip" "$line" -o "$(basename "$line").gz"
    gunzip "$(basename "$line").gz"
  done < js_files.txt
else
  echo "Not found any JS files"
  exit 1
fi

# Clean up
rm index.html
rm css_files.txt
rm js_files.txt

echo "All files downloaded with gzip support"
