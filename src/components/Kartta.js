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
import Info from './Info';


const Kartta = () => {

  function KaytaPersistenttia(key, defaultValue) {
    const [value, setValue] = useState(() => {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    });

    useEffect(() => {
      localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
  }

  const [valittupaiva, setValittupaiva] = KaytaPersistenttia("valittupaiva", moment().locale('fi'));
  const [valitunpaivanparillisuus, setValitunpaivanparillisuus] = KaytaPersistenttia("valitunpaivanparillisuus", "");
  const [valitunpaivanviikonpaiva, setValitunpaivanviikonpaiva] = KaytaPersistenttia("valitunpaivanviikonpaiva", "");

  function selvitaParillisuus(paiva) {
    const lopullinenaika = paiva.week();
    if (lopullinenaika % 2 === 0 ) {
      return "parillinen";
    } else {
      return "pariton";
    }
  }

  function selvitaViikonpaiva(paiva) {
    const days = ['sunnuntai','maanantai','tiistai','keskiviikko','torstai','perjantai','lauantai'];
    const viikonpaivanumero = moment(paiva).weekday();
    return days[viikonpaivanumero];
  }

  function selvitaTuloaika(aika) {		
    const format = 'hh:mm';
    const ajatviikonpaivittain = aika.split(" ");
    const kellonajat = ajatviikonpaivittain[1];
    const tuloaika = kellonajat.substring(0,5);		
    const pysakilla = moment(tuloaika, format);		
    if (moment(valittupaiva).isAfter(pysakilla)) {
        return false;
    } else {
        return true;
    }
  }

  function suodata(vuoronparillisuus, vuoronaika) {		
    if(valitunpaivanparillisuus) {
      if (vuoronparillisuus.includes(valitunpaivanparillisuus) && vuoronaika.includes(valitunpaivanviikonpaiva)) {
        if (selvitaTuloaika(vuoronaika)) {
          return "tulossa";
        } else {
          return "mennyt";
        }
      } else {
          return "";
      }
    }
  }

  const [state, setState] = useState({});

  const [data, setPysakit] = useState([]);

  useEffect(() => {
    if(!valittupaiva && !valitunpaivanparillisuus) {
      setValittupaiva(moment(valittupaiva).locale('fi')); 
      setValitunpaivanparillisuus(selvitaParillisuus(moment(valittupaiva).locale('fi')));
      setValitunpaivanviikonpaiva(selvitaViikonpaiva(moment(valittupaiva).locale('fi')));	
    }
  }, []);
      
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
  }, [data]);

  const position = [62.235851235588875, 25.76126531656598];

  const style = {
    height: '100vh',/* '80vh',*/
    width: '100%'
  };

  const tulossaikoni = new L.Icon({
    iconUrl: tulossabusbitikoni,
    iconRetinaUrl: tulossabusbitikoni,
    popupAnchor: [0, 0],
    iconSize: [43, 43],
  });

  const mennytikoni = new L.Icon({
    iconUrl: mennytbusbitikoni,
    iconRetinaUrl: mennytbusbitikoni,
    popupAnchor: [0, 0],
    iconSize: [43, 43],
  });

  const tyhjaikoni = new L.Icon({
    iconUrl: tyhjabusbitikoni,
    iconRetinaUrl: tyhjabusbitikoni,
    popupAnchor: [0, 0],
    iconSize: [7, 7],
  });

  const styles = {
    margin: 10,
    fillColor: 'white',
    weight: 100,
    opacity: 1,
    color: 'white',
    fillOpacity: 1,
  };


  const rows = data.map(item => Object.values(item));

  const increaseCount = () => {
    let tamapaiva = moment(valittupaiva).clone().add(1,'days');
    console.log(tamapaiva.toString());
    setValitunpaivanparillisuus(selvitaParillisuus(moment(tamapaiva).locale('fi')));
    setValitunpaivanviikonpaiva(selvitaViikonpaiva(tamapaiva));	  
    return setValittupaiva(tamapaiva);
  }

  const decreaseCount = () => {
    let tamapaiva = moment(valittupaiva).clone().subtract(1,'days');
    console.log(tamapaiva.toString());
    setValitunpaivanparillisuus(selvitaParillisuus(moment(tamapaiva).locale('fi')));
    setValitunpaivanviikonpaiva(selvitaViikonpaiva(tamapaiva));	  	  
    return setValittupaiva(tamapaiva);
  }

  useEffect(() => {
    setValittupaiva(valittupaiva);
    setValitunpaivanparillisuus(selvitaParillisuus(moment(valittupaiva).locale('fi')));
    setValitunpaivanviikonpaiva(selvitaViikonpaiva(valittupaiva));	  	  
  }, [valittupaiva]);

  function naytaValittupaiva() {
    const tamaviikonpaiva = selvitaViikonpaiva(moment(valittupaiva).locale('fi'));
    const tamapaiva = moment(valittupaiva).locale("fi").format("DD.MM.YYYY");
    return tamaviikonpaiva + " " + tamapaiva;
  }

  /*
  function paivitysSivu(){      
    window.location.reload();
  } 
  */

  function alkuSivu(){      
    const tamapaiva = moment().locale("fi");
    return setValittupaiva(tamapaiva);	
  }

  return (
    <div>
      <div align="center">
        <div></div>
        <div style={styles}>
          &nbsp; 
          &nbsp;
          <button onClick={decreaseCount}>&nbsp;&nbsp;-&nbsp;&nbsp;</button>
          &nbsp;
          &nbsp;
          &nbsp;
          {naytaValittupaiva()}
          &nbsp;
          &nbsp;
          &nbsp;
          <button onClick={increaseCount}>&nbsp;&nbsp;+&nbsp;&nbsp;</button>
          &nbsp;
          &nbsp;
          &nbsp;
          &nbsp;
          <button type="button" onClick={alkuSivu}>
          <span>&nbsp;۝&nbsp;</span>
          </button>
          &nbsp;
          &nbsp;                  
        </div>
      </div>
      <div>
      <MapContainer center={position} zoom={13} scrollWheelZoom={true} style={style}> 
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
        />
        <Info
          title={"Mobilebusbit 1.0 by Dareijan"}
          markerPosition={[20.27, -157]}
          description="Autot kartalla!"
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
          }})
        };          
      </MapContainer>
      </div>
    </div>
    );
};

export default Kartta;