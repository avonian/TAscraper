const puppeteer = require('puppeteer');
const  fs = require('fs');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const args = process.argv.slice(2)
  if(!args[0]) {
    console.log('Must provide a URL to scrape.')
    return
  }
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(args[0]);
  await page.addScriptTag({url: 'https://code.jquery.com/jquery-3.2.1.min.js'});

  let result = {};

  sleep(3000);
  /* Obtain overall rating */
  result.overallRating = await page.evaluate(`$('.overallRating').text()`);

  /* Click on all 'more' links */
  await page.evaluate(`$('.ui_column > .prw_rup > .entry > .partial_entry > .ulBlueLinks').click()`);
  sleep(3000);

  /* Scrape reviews */
  let reviewsQuery = `
    let reviews = [];
    $('.ui_column > .prw_rup > .entry > .partial_entry').each((i, el) => {
      let review = $(el).closest('.reviewSelector');
      reviews.push({
        id: review.data('reviewid'),
        date: review.find('.ratingDate').attr('title'),
        rating: review.find('.ui_bubble_rating').attr('class').split("_")[3] / 10,
        text: el.textContent
      })
    });
    reviews
  `
  result.reviews = await page.evaluate(reviewsQuery);

  /* Save results */
  fs.writeFile('reviews.json', JSON.stringify(result), () => {});

  console.log(`${result.reviews.length} reviews scraped`);

  await page.close();
  await browser.close();
})();