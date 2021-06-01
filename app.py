from flask import Flask, render_template, jsonify, request
from requests_html import HTMLSession
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
}


def googleWordScraper(search_word):
    base_site = "https://www.google.com/search"

    response = requests.get(base_site, params={"q": search_word}, headers=HEADERS)

    soup = BeautifulSoup(response.text, "lxml")
    posts = []

    all_g = soup.find_all('div', class_='tF2Cxc')

    for g in all_g:
        info = {}
        title = g.find('h3', class_='LC20lb DKV0Md')
        info['title'] = title.string if title else None

        link_container = g.find('div', class_='yuRUbf')
        if link_container is not None:
            link = link_container.find('a')
            info['link'] = link.get('href')

        description = g.find('span', class_='aCOpRe')
        info['description'] = description.text if description else None

        posts.append(info)
    
    return posts


def imdbTopRatedMovieScraper():
    base_site = 'https://www.imdb.com/chart/top/?ref_=nv_mv_250'
    html_text = requests.get(base_site).content
    soup = BeautifulSoup(html_text, 'lxml')
    content = soup.find_all('tbody', class_="lister-list")[0]
    items = content.find_all('tr')

    content_json = []
    index = 0
    for item in items:
        index += 1
        if index == 50:
            break
        # CONTAINERS
        title_and_url_cont = item.find('td', class_="titleColumn")
        url_cont = title_and_url_cont.find('a')
        rating_cont = item.find('td', {'class':'ratingColumn imdbRating'})
        poster_cont = item.find('td', {'class': 'posterColumn'})

        # CONTENT
        url = base_site + url_cont.attrs['href']
        title = url_cont.text
        year = title_and_url_cont.find('span', class_="secondaryInfo").text
        year = year.strip("()")
        rating = rating_cont.find('strong').text
        img_src = poster_cont.find('img').attrs['src']
        print(img_src)

        content_json.append({
            "img_src": img_src,
            "url": url,
            "title": title,
            "year": year,
            "rating": rating,
        })

    return content_json


def getDefaultSymbols():
    response = requests.get('https://api.exchangerate.host/symbols')
    data = response.json()['symbols']
    return data


def getConversion(convert_from, convert_to):
    url = 'https://api.exchangerate.host/convert'
    response = requests.get(url, params={'from': convert_from,
                                         'to': convert_to})
    data = response.json()
    if data['success']:
        return data
    else:
        return None

@app.route("/")
def homepage():
    # Supported symbols for foreign exchange API
    supported_symbols = getDefaultSymbols()
    symbol_info = [{'code': supported_symbols[symbol]['code'],
                             'description': supported_symbols[symbol][
                                                            'description']}
                            for symbol in supported_symbols]

    context = {
        'exchange-rates-data': symbol_info,
    }
    return render_template("index.html", context=context)

@app.route("/google", methods=['POST'])
def google_scraper():
    word = request.get_json()
    posts = googleWordScraper(word)
    result = {
        'posts': posts,
    }
    print(result)

    return jsonify(result)

@app.route("/imdb", methods=['GET'])
def imdb_scraper():
    print("GETTING DATA...")
    top_rated = imdbTopRatedMovieScraper()
    print(top_rated)
    result = {
        'posts': top_rated,
    }
    return jsonify(result)


@app.route("/exchange-rates")
def exchange_rates():
    try:
        data = request.args.to_dict()
        
        convert_from = data.get('convert_from')
        convert_to = data.get('convert_to')
        
        data = getConversion(convert_from, convert_to)
        result = {
            'query': data['query'],
            'rate': data['info']['rate']
        }
        print(result)
        return jsonify(result)
    except Exception as e:
        print(e)
        return None

if __name__ == '__main__':
    app.run(debug=True)
