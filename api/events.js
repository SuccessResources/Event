const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/' +
  '2PACX-1vQok6fPz76mMmYr1lAH0U9HAkoQJjPne3CNeS8BTZNWA2kY8pQrszCKgNSDbvJrR_ISc2N8ktqnvZMS' +
  '/pub?gid=1518302082&single=true&output=csv';

// Columns (0-based index):
// 0  City
// 1  Country
// 2  Flag
// 3  Display Dates
// 4  Timezone
// 5  Event ISO Date
// 6  Event Link
// 7  Online Standard Buy Link
// 8  Online VIP Buy Link
// 9  Online Thank you Page Updated Link
// 10 Online Confirmation Page Updated Link
// 11 Online Thank You Page old
// 12 Online Event Stripe Button ID
// 13 Live Event Thrive-cart Link (Standard Pass)
// 14 Live Event Stripe Button ID
// 15 Trainer Key
// 16 Live Event Price Display
// 17 Live Event Currency
// 18 Geo Countries
// 19 Status

function parseRow(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function toSlug(city) {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export default async function handler(req, res) {
  try {
    const response = await fetch(SHEET_URL);
    if (!response.ok) throw new Error(`Sheet returned ${response.status}`);

    const csv = await response.text();
    const lines = csv.split('\n').filter(l => l.trim());

    const events = [];
    for (let i = 1; i < lines.length; i++) {
      const c = parseRow(lines[i]);
      const city = c[0];
      const status = c[19];
      if (!city || status !== 'Active') continue;

      events.push({
        city:        city,
        country:     c[1],
        flag:        c[2],
        display:     city,
        dates:       c[3],
        time:        c[4],
        eventDate:   c[5],
        btnId:       c[12],
        cartUrl:     c[7],
        liveCartUrl: c[13],
        liveBtnId:   c[14],
        cur:         'USD',
        price:       19,
        trainer:     c[15],
        geo:         c[18] ? c[18].split(',').map(x => x.trim()).filter(Boolean) : [],
        citySlug:    toSlug(city),
        livePrice:   parseFloat(c[16]) || 0,
        liveCur:     c[17],
      });
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    res.json(events);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
