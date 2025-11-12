# Pokemon Shiny Hunt Overlay

A simple web-based overlay for Pokemon shiny hunts designed for streaming with TikTok Live Studio. Features a transparent background and real-time counter updates from a text file.

## Setup Instructions

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Configure File Paths**

   Create a `config.json` file to set your file paths:
   ```json
   {
     "counterFilePath": "path/to/your/counter.txt",
     "pokemonImage": "path/to/your/pokemon.png",
     "failedCatchesFilePath": "path/to/your/failed_catches.txt",
     "lastShinyImage": "path/to/your/last_shiny.png",
     "livingDexCount": "path/to/your/living_dex_count.txt",
     "livingDexTotal": 0,
     "sections": {
       "currentHunt": true,
       "failedAttempts": true,
       "lastShiny": true,
       "livingDex": false
     }
   }
   ```

3. **Configure Hosts File**

   Add the following to your hosts file:
   ```text
   127.0.0.1 shiny.local # feel free to change the domain to whatever you want
   ```
   This will allow you to access the overlay at `http://shiny.local` (or whatever you changed the domain to) from your browser, as TikTok Live Studio requires a "valid" URL.

4. **Start the Server**

   ```bash
   npm start
   ```

5. **Add to TikTok Live Studio**

   - Open TikTok Live Studio
   - Add a new source
   - Choose "Link" as the source type
   - Enter: `http://shiny.local` (or whatever you changed the domain to)
   - The overlay will appear with a transparent background

## Usage

- The counter updates automatically every second by reading from your text files
- When you update the Pokemon image file path in `config.json`, the new image will load automatically
- The background is transparent, perfect for overlaying on your stream
- Toggle any overlay section on or off by updating the boolean flags under `sections` in `config.json`
- The shiny living dex section reads the `livingDexCount` text file and displays it alongside the static `livingDexTotal`
- The last shiny image is updated automatically by reading from your image file

## File Structure

```
shiny-overlay/
├── package.json          # Dependencies and scripts
├── server.js             # Express server
├── index.html            # Main HTML page
├── style.css             # Styling
├── script.js             # Client-side JavaScript
├── config.json           # Configuration file
└── README.md             # This file
```

## Troubleshooting

- Make sure the counter file exists and contains only a number
- Ensure the Pokemon image file exists at the specified path
- Check that port 80 is not being used by another application
- Verify file paths in `config.json` are correct (use absolute paths if needed)
- Verify the domain is correct in your hosts file
- Stop and restart the server (currently, if you change any paths in the config.json file, you need to stop and restart the server for the changes to take effect)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.