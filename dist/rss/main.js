// Helper functions first

// Get nth weekday of a month
function getNthWeekdayOfMonth(year, month, weekday, nth) {
  const date = new Date(year, month - 1, 1);
  let count = 0;
  while (date.getMonth() === month - 1) {
      if (date.getDay() === weekday) {
          count++;
          if (count === nth) return date.getDate();
      }
      date.setDate(date.getDate() + 1);
  }
  return null;
}

// Get start day of nth week
function getNthWeekStartDate(year, month, nth) {
  const firstOfMonth = new Date(year, month - 1, 1);
  let startDay = 1 + (nth === "second" ? 7 : nth === "third" ? 14 : nth === "fourth" ? 21 : 0);
  return startDay;
}

// Check if a mental holiday occurs today
function isTodayMentalHoliday(h, today) {
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const year = today.getFullYear();

  if (h.month !== month) return false;

  switch(h.type) {
      case 'day':
          if (!h.rule) return false;
          switch(h.rule.kind) {
              case 'fixed':
                  return day === h.rule.day;
              case 'nthWeekdayOfMonth':
                  return day === getNthWeekdayOfMonth(year, month, h.rule.weekday, h.rule.nth);
              case 'firstMondayAfterDST':
                  const dstMonday = new Date(year, 2, 8); // March 8
                  while(dstMonday.getDay() !== 1) dstMonday.setDate(dstMonday.getDate() + 1);
                  return day === dstMonday.getDate();
          }
          break;
      case 'week':
          if (!h.rule) return false;
          switch(h.rule.kind) {
              case 'nthWeek':
                  const start = getNthWeekStartDate(year, month, h.rule.which);
                  return day >= start && day < start + 7;
              case 'firstFullWeek':
                  return day >= 1 && day <= 7;
              case 'lastWeekOfFebOrFirstWeekOfMar':
                  if (month === 2) return day >= 22;
                  if (month === 3) return day <= 7;
          }
          break;
      case 'month':
          return true; // whole month
      case 'note':
          return false;
  }
  return false;
}

// --- Cloudflare Worker entry point ---
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})

async function handleRequest(event) {
  const request = event.request;
  const cacheDuration = 2 * 60 * 60; // 2 hours
  const cache = caches.default;

  let response = await cache.match(request.url);
  if (response) return response;

  // Fetch JSON from GitHub
  const [mentalRes, lgbtqRes] = await Promise.all([
      fetch('https://raw.githubusercontent.com/JDjump12345/gnbohio/refs/heads/main/dist/rss/days.json'),
      fetch('https://raw.githubusercontent.com/JDjump12345/gnbohio/refs/heads/main/dist/rss/days2.json')
  ]);
  const [mentalData, lgbtqData] = await Promise.all([mentalRes.json(), lgbtqRes.json()]);

  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const dateRSS = today.toUTCString();

  // Filter holidays
  const todaysMental = mentalData.filter(h => isTodayMentalHoliday(h, today));
  const todaysLGBTQ = lgbtqData.filter(h => h.month === month && day >= h.day_start && day <= (h.day_end || h.day_start));

  const allHolidays = [...todaysMental, ...todaysLGBTQ];

  const itemsXML = allHolidays.map(h => `
      <item>
          <title>${h.name}</title>
          <description>${h.note || ''} ${h.icon || ''}</description>
          <pubDate>${dateRSS}</pubDate>
          <guid>${h.name.replace(/\s/g,'-')}-${today.getFullYear()}${month}${day}</guid>
      </item>
  `).join('');

  const rssXML = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
      <title>Today's Holidays</title>
      <link>https://gnbohio.io</link>
      <description>Daily holiday updates</description>
      <lastBuildDate>${dateRSS}</lastBuildDate>
      ${itemsXML}
  </channel>
</rss>`;

  response = new Response(rssXML, {
      headers: {
          'Content-Type': 'application/rss+xml; charset=UTF-8',
          'Cache-Control': `max-age=${cacheDuration}`
      }
  });

  event.waitUntil(cache.put(request.url, response.clone()));
  return response;
}
