import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import L from 'leaflet';
import tulossabusbitikoni from './assets/images/busbittulossa.svg';
import mennytbusbitikoni from './assets/images/busbitmennyt.svg';
import tyhjabusbitikoni from './assets/images/ympyra.svg';
import * as Papa from 'papaparse';
import { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';  


const Map = () => {

  /* oletusnäkymä tämä päivä
  painikkeet 
  Ma Ti Ke To Pe
  (mikä päivä nyt on)
  (aseta tämäpäivä globaaliin objektiin)
  -luo päivämäärät; luo 6 päivää eteenpäin; jos viikonloppu, ota ne päivät pois
  -kun valitaan päivä, aseta se globaaliin objektiin ja renderöi kartta uudelleen
  */
 



    function selvitaParillisuus(d) {
		const lopullinenaika = moment().week();
		if (lopullinenaika % 2 === 0 ) {
			return "parillinen";
		} else {
			return "pariton";
		}
    }
    
    function selvitaViikonpaiva() {
        const days = ['sunnuntai','maanantai','tiistai','keskiviikko','torstai','perjantai'];
		const nyt = moment().locale('fi');
		return days[moment().weekday()];
    }
	
	
	function selvitaTuloaika(aika) {		
		const format = 'hh:mm';
		const nyt = moment();		
		const ajatviikonpaivittain = aika.split(" ");
		const kellonajat = ajatviikonpaivittain[1];
		const tuloaika = kellonajat.substring(0,5);		
		const pysakilla = moment(tuloaika, format);		
		if (nyt.isAfter(pysakilla)) {
            return false;
        } else {
            return true;
        }
	}
    
    function suodata(vuoronparillisuus, vuoronaika) {		
		if (vuoronparillisuus.includes(parillisuus) && vuoronaika.includes(viikonpaiva)) {
			if (selvitaTuloaika(vuoronaika)) {
            	return "tulossa";
			} else {
				return "mennyt";
			}
        } else {
            return "";
        }
    }
    
    const [state, setState] = useState({
      pysakit: []
    });
    
    const [data, setPysakit] = useState([]);

    const [paivat, setPaivat] = useState({
      maanantai: [],
      tiistai:  [],
      keskiviikko:  [],
      torstai:  [],
      perjantai:  []
    });

    var paiva = new Date();
    
    const kuukausi = paiva.getMonth() + 1;
    
    const paivamaara = kuukausi + "." + paiva.getDate() + "." + paiva.getFullYear(); 
    
    const parillisuus = selvitaParillisuus(paivamaara);
    
    const viikonpaiva = selvitaViikonpaiva();

    console.log("Halutut tiedot: " + parillisuus + " " + paiva + " " + viikonpaiva );
        
    useEffect(() => {

        const url  = './data.csv';

        const fetchData = async () => {

          const result = await axios.get(url, {
            headers: {
              'Access-Control-Allow-Origin': true,
            },
          });

          var datapysakeille = Papa.parse(result.data);       
          for (var i = 0; i < datapysakeille.data.length; i++) {
            var nimi = datapysakeille.data[i][0];
            var parillisuus = datapysakeille.data[i][1];
            var aika = datapysakeille.data[i][2];
            var lat = datapysakeille.data[i][3];
            var lon = datapysakeille.data[i][4];
            data.push({i, nimi, parillisuus, aika, lat, lon});
          }
          setPysakit(data);
          setState(data);    

          }
        fetchData();
      }, []);
 
  const position = [62.235851235588875, 25.76126531656598];

  const style = {
    height: '100vh',/* '80vh',*/
    width: '100%'
  };

  const tulossaikoni = new L.Icon({
    iconUrl: tulossabusbitikoni,
    iconRetinaUrl: tulossabusbitikoni,
    popupAnchor: [0, 0],
    iconSize: [40, 40],
  });

  const mennytikoni = new L.Icon({
    iconUrl: mennytbusbitikoni,
    iconRetinaUrl: mennytbusbitikoni,
    popupAnchor: [0, 0],
    iconSize: [40, 40],
  });

  const tyhjaikoni = new L.Icon({
    iconUrl: tyhjabusbitikoni,
    iconRetinaUrl: tyhjabusbitikoni,
    popupAnchor: [0, 0],
    iconSize: [10, 10],
  });

  const styles = {
    fillColor: 'none',
    weight: 0.5,
    opacity: 1,
    color: 'white',
    fillOpacity: 1,
  };


  const rows = data.map(item => Object.values(item));

  return (
    <div>
    <div>
      <div>
      </div>
      <div>
      </div>
    </div>
    <div>
      <MapContainer center={position} zoom={13} scrollWheelZoom={true} style={style}>
    <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
      />
      {rows.map((row, index) => {
	      const point = [row[4],row[5]];
		  const ikonintyyppi = suodata(row[2],row[3]);
          if (ikonintyyppi === "tulossa") {
            return (
            <Marker position={point} key={row[0]} icon={tulossaikoni} >
              <Popup>
              <span>{row[1]} <br/>{row[3]} {row[2]}  </span>
              </Popup>
            </Marker>
            )
          } else if (ikonintyyppi === "mennyt") {
            return (
            <Marker position={point} key={row[0]} icon={mennytikoni} >
              <Popup>
              <span>{row[1]} <br/>{row[3]} {row[2]}  </span>
              </Popup>
            </Marker>
            )		
          } else {
            return (
            <Marker position={point} key={row[0]} icon={tyhjaikoni} >
              <Popup>
              <span>{row[1]} <br/>{row[3]} {row[2]}  </span>
              </Popup>
            </Marker>
            )
          }    
      })};          
      </MapContainer>
    </div>
  </div>
  );
};

export default Map;