(function() {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)
    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  /**
   * Easy on scroll event listener 
   */
  const onscroll = (el, listener) => {
    el.addEventListener('scroll', listener)
  }

  /**
   * burgerMenu
   */
  const burgerMenu = select('.burger')
  on('click', '.burger', function(e) {
    burgerMenu.classList.toggle('active');
  })

  // =============================================
  // SCRAPED DATA DIV
  // ============================================
  var scraping_info = select('#scraping-info');
  var portfolio_grid = select('#portfolio-grid');

  // =============================================
  window.addEventListener('load', () => {
    let portfolioContainer = select('#portfolio-grid');
    if (portfolioContainer) {
      let portfolioIsotope = new Isotope(portfolioContainer, {
        itemSelector: '.item',
      });

      let portfolioFilters = select('#filters a', true);

      on('click', '#filters a', function(e) {
        e.preventDefault();
        portfolioFilters.forEach(function(el) {
          el.classList.remove('active');
        });
        this.classList.add('active');

        const navbar = document.querySelector('.scraper-navbar');
        const active = this.dataset.filter.slice(1);
        const exchange_rates_element = document.querySelector('#exchange-rates');
        
        // Possible active: google, imdb, exchange-rates

        document.querySelector('a.navbar-brand.scraper').innerHTML = this.innerHTML;

        if ((active === "exchange-rates") || (active === "imdb")){
          navbar.style.display = "none";
        } else {
          navbar.style.display = "block";
        };

        if (active === 'exchange-rates'){
          exchange_rates_element.style.display = "block";
        }else {
          exchange_rates_element.style.display = "none";
        }

        portfolioIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
        portfolioIsotope.on('arrangeComplete', function() {
          AOS.refresh()
        });
      }, true);
    }

  });

  /**
   * Animation on scroll
   */
  window.addEventListener('load', () => {
    AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    })
  });

  // =================================================
  // HANDLE CLICKING FOR REQUESTS
  // =================================================

  document.addEventListener('DOMContentLoaded', () => {
  
    let portfolioFilters = select('#filters a', true);
    on('click', '#filters a', function(e) {
        // Possible active: google, imdb, exchange-rates
        const active = this.dataset.filter.slice(1);
        scraping_info.innerHTML = 'READY T0 SCRAPE';

        // ===================================================
        // ================= GET REQUESTS ==================
        // ===================================================
        
        // search exchange rates data on GET only..
        if (active === "exchange-rates"){
          const convert_from = select("#convert-from");
          const convert_to = select("#convert-to");
          getDefaultScraped(active, convert_from, convert_to);

          const search_rate = select("#search-exchange");
          search_rate.onclick = () => {
            getDefaultScraped(active, convert_from, convert_to);
          }
        }else{
          getDefaultScraped(active);
        }

        // ===================================================
        // ================= POST REQUESTS ==================
        // ===================================================

        const word_to_scrape = select('#scraper-searcher');
        const scraper_submit_btn = select('#scraper-submit-btn')
        scraper_submit_btn.onclick = (e) => {
          e.preventDefault();
          if (active !== 'exchange-rates'){
            getPostScraped(active, word_to_scrape.value);
          }
        };
    }, true);

  
  })

  // ===========================================================
  // ----------------- GET AND POST REQUESTS HANDLER -----------

  function getDefaultScraped(url, convert_from=null, convert_to=null){
    console.log("URL: ", url)
    scraping_info.innerHTML = "GETTING DATA...";

    if ((convert_from !== null) && (convert_to !== null)){
      var parameters = {"convert_from": convert_from.value,
                          "convert_to": convert_to.value};
    }else {
      var parameters = null;}

    $.ajax({
      url: `/${url}`,
      contentType: 'application/json',
      data: parameters,
      type: 'GET',
      success: function(response){    
        setUpScrapedDataSpace();
        if (url === "imdb"){
          renderImdbPost(response.posts, url);
        }
        if (url === 'exchange-rates'){
          renderCurrencyExchageRates(response);
        }
        scraping_info.innerHTML = "SCRAPED SUCCESSFULLY...";
      },
      error: function(error){
        console.log(error);
      }
    });
  }

  function getPostScraped(url, search_word){
    scraping_info.innerHTML = "SCRAPING DATA... PLEASE WAIT.";
    // Possible URLS: google, imdb, exchange-rates
    $.ajax({
      url: `/${url}`,
      contentType: 'application/json',
      data: JSON.stringify(search_word),
      type: 'POST',
      success: function(response){
        scraping_info.innerHTML = "FORMATTING DATA...";
        setUpScrapedDataSpace();

        if (url === "google"){
          renderGooglePost(response.posts, url)
          scraping_info.innerHTML = "SCRAPED SUCCESSFULLY...";

        }
      },
      error: function(error){
        console.log(error);
        scraping_info.innerHTML = "ERROR SCRAPING PAGE. CONTACT PAGE ADMIN...\n" +
                                  "OR TRY AGAIN!"
      }
    });
  }
  // ============================================================

  function setUpScrapedDataSpace(){
    portfolio_grid.style.position = 'initial';
    portfolio_grid.style.height = 'auto';

    const item = select('.item', true);
    for (let index = 0; index < item.length; index++) {
      const element = item[index];
      element.style.position = 'initial';
    }
  }

  // ===========================================================
  // --------------------- SCRAPED DATA RENDERER ---------------

  function renderGooglePost(data, scrape_page){
    const getter = `#${scrape_page}`
    const page = select(getter);

    page.innerHTML = '';
    for (let index = 0; index < data.length; index++) {
      const element = data[index];
      const link = element.link;
      const title = element.title;
      const description = element.description;
      
      const col_div = document.createElement('div');
      col_div.className = 'col';

      const card_div = document.createElement('div');
      card_div.className = 'card h-100';

      const card_body_div = document.createElement('div');
      card_body_div.className = 'card-body';

      const card_title_div = document.createElement('div');
      card_title_div.className = 'card-title';
      card_title_div.innerHTML = title;

      const line_break = document.createElement('hr')

      const card_text_div = document.createElement('div');
      card_text_div.className = 'card-text';
      card_text_div.innerHTML = description;

      card_body_div.appendChild(card_title_div)
      card_body_div.appendChild(line_break);
      card_body_div.appendChild(card_text_div)

      const card_footer_div = document.createElement('div');
      card_footer_div.className = 'card-footer';

      const text_muted_small = document.createElement('small');
      text_muted_small.className = 'text-muted';
      const cont_link = document.createElement('a');
      cont_link.href = link;
      cont_link.innerText = "Link: "+link;
      text_muted_small.append(cont_link);

      card_footer_div.appendChild(text_muted_small);

      card_div.appendChild(card_body_div);
      card_div.appendChild(card_footer_div);

      col_div.append(card_div);
      page.appendChild(col_div);
    }

  }

  function renderImdbPost(data, scrape_page){
    const getter = `#${scrape_page}`
    const page = select(getter);
    
    page.innerHTML = '';
    for (let index = 0; index < data.length; index++) {
      const element = data[index];
      const img_src = element.img_src;
      const link = element.url;
      const year = element.year;
      const rating = element.rating;
      const title = element.title;
      
      
      const col_div = document.createElement('div');
      col_div.className = 'col';

      const card_div = document.createElement('div');
      card_div.className = 'card h-100';

      const img = document.createElement('img');
      img.src = img_src;
      img.className = "card-img-top";
      img.alt = title;
      img.style.height = '75%';
      img.style.width = '75%';

      const card_body_div = document.createElement('div');
      card_body_div.className = 'card-body';

      const card_title_div = document.createElement('div');
      card_title_div.className = 'card-title';
      card_title_div.innerHTML = title;

      const line_break = document.createElement('hr')

      const card_text_div = document.createElement('div');
      card_text_div.className = 'card-text';
      card_text_div.innerHTML = "Rating: " + rating + "\nYear: " + year;

      card_body_div.appendChild(card_title_div)
      card_body_div.appendChild(line_break);
      card_body_div.appendChild(card_text_div)

      const card_footer_div = document.createElement('div');
      card_footer_div.className = 'card-footer';

      const text_muted_small = document.createElement('small');
      text_muted_small.className = 'text-muted';
      const cont_link = document.createElement('a');
      cont_link.href = link;
      cont_link.innerText = "Link: "+link;
      text_muted_small.append(cont_link);

      card_footer_div.appendChild(text_muted_small);

      card_div.appendChild(img);
      card_div.appendChild(card_body_div);
      card_div.appendChild(card_footer_div);

      col_div.append(card_div);
      page.appendChild(col_div);
    }

  }

  function renderCurrencyExchageRates(data){
    const amount = data.query.amount;
    const from = data.query.from;
    const to = data.query.to;
    const rate = data.rate;

    const addon = amount + ' ' + from + ' -> ' + to;

    const info_addon = select('#exchange-info-addon');
    info_addon.innerHTML = addon;

    const rates_info = select('#exchange-info');
    rates_info.value = rate;
  }
  // ===============================================================

})()
