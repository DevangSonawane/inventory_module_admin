# How to Start the Dev Server

## ⚠️ IMPORTANT: Run from the CORRECT directory!

You MUST run the dev server from inside the `inventory_module` directory, NOT from the root `inventory_module-main` directory.

## Steps:

1. **Navigate to the correct directory:**
   ```bash
   cd /Users/devangsonawane/Downloads/inventory_module-main/inventory_module
   ```

2. **If port 5173 is already in use, kill the existing process:**
   ```bash
   lsof -ti:5173 | xargs kill -9
   ```

3. **Start the dev server:**
   ```bash
   npm run dev
   ```

4. **Or use a different port if needed:**
   ```bash
   npm run dev -- --port 5174
   ```

## Quick One-Liner:
```bash
cd /Users/devangsonawane/Downloads/inventory_module-main/inventory_module && lsof -ti:5173 | xargs kill -9 2>/dev/null; npm run dev
```

## After Starting:

- The app will be available at: `http://localhost:5173`
- Open your browser and navigate to that URL
- Log in if required
- Look for "Purchase Requests" in the sidebar under the "Management" section

## Troubleshooting:

If you still see rollup errors:
1. Make sure you're in `inventory_module` directory (not the root)
2. Delete `node_modules` and `package-lock.json`:
   ```bash
   cd /Users/devangsonawane/Downloads/inventory_module-main/inventory_module
   rm -rf node_modules package-lock.json
   npm install
   ```
3. Try again: `npm run dev`
