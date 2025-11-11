#!/bin/bash

# Usage instructions printed when no arguments are provided
print_usage() {
  echo "Usage: ./record_demo.sh [OPTIONS]"
  echo "Options:"
  echo "  -d, --display   Display number to record (default: 0)"
  echo "  -t, --time      Recording duration in seconds (default: 180)"
  echo "  -o, --output    Output filename (default: demo.mp4)"
  echo "  -s, --size      Screen size (default: 1920x1080)"
  echo ""
  echo "Example:"
  echo "  ./record_demo.sh -d 0 -t 300 -o main_screen.mp4    # Record display 0 for 5 minutes"
  echo "  ./record_demo.sh -d 1 -o second_screen.mp4         # Record display 1 with default duration"
}

# Default values
DISPLAY_NUM=0
DURATION=180
OUTPUT="demo.mp4"
SIZE="1920x1080"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -d|--display)
      DISPLAY_NUM="$2"
      shift 2
      ;;
    -t|--time)
      DURATION="$2"
      shift 2
      ;;
    -o|--output)
      OUTPUT="$2"
      shift 2
      ;;
    -s|--size)
      SIZE="$2"
      shift 2
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      print_usage
      exit 1
      ;;
  esac
done

# Set display and configure screen
export DISPLAY=":${DISPLAY_NUM}"
xrandr --fb $SIZE 2>/dev/null || echo "Warning: Could not set screen size"

echo "Starting recording..."
echo "Recording display ${DISPLAY_NUM} for ${DURATION} seconds..."
echo "Output will be saved to: ${OUTPUT}"

# Record screen with specified parameters
ffmpeg -f x11grab \
  -video_size $SIZE \
  -framerate 30 \
  -i $DISPLAY \
  -t $DURATION \
  -c:v libx264 \
  -preset ultrafast \
  -crf 18 \
  -pix_fmt yuv420p \
  "$OUTPUT"

# Check if recording was successful
if [ $? -eq 0 ]; then
  echo "Recording completed successfully!"
  echo "Video saved as: ${OUTPUT}"
else
  echo "Error occurred during recording"
  exit 1
fi