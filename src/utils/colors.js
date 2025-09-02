export function rgbToHex(rgb) {
    if (!rgb || typeof rgb !== 'string') return '#000000';
    // Support rgba(r,g,b,a)
    let rgbMatch = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)$/i);
    if (!rgbMatch) {
        // Already hex? Normalize and return
        const hexMatch = rgb.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
        if (hexMatch) return rgb.toLowerCase();
        return '#000000'; // Default if format is unexpected
    }
    const toHex = (c) => {
        const hex = parseInt(c).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(rgbMatch[1]) + toHex(rgbMatch[2]) + toHex(rgbMatch[3]);
}
