import fs from 'fs';

function getTodaysDate() {
  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
}

function isMentalHolidayToday(h, today) {
  if (h.month !== today.month) return false;
  if (h.type === 'day' && h.rule.kind === 'fixed') {
    return h.rule.day === today.day;
  }
  // add other rules here...
  return false;
}

function generateRSS(items) {
  const now = new Date().toUTCString();
  const rssItems = items.map(h => `
    <item>
      <title>${h.name}</title>
      <description>${h.note || ''}</description>
      <pubDate>${now}</pubDate>
      <guid>${h.name.replace(/\s/g,'-')}-${now}</guid>
    </item>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>Today's Holidays</title>
  <link>https://example.com</link>
  <description>Daily holiday updates</description>
  <lastBuildDate>${now}</lastBuildDate>
  ${rssItems}
</channel>
</rss>`;
}

async function main() {
  const today = getTodaysDate();

  const mentalData = JSON.parse(fs.readFileSync('days.json', 'utf-8'));
  const lgbtqData = JSON.parse(fs.readFileSync('days2.json', 'utf-8'));

  const todaysMental = mentalData.filter(h => isMentalHolidayToday(h, today));
  const todaysLGBTQ = lgbtqData.filter(h => h.month === today.month && today.day >= h.day_start && today.day <= (h.day_end || h.day_start));

  const allHolidays = [...todaysMental, ...todaysLGBTQ];

  const rssXML = generateRSS(allHolidays);
  fs.writeFileSync('holidays.xml', rssXML, 'utf-8');
  console.log('RSS feed generated!');
}

main();
