-- ============================================================================
-- LA RED · VERTICAL 1 — CATÁLOGO DE CIUDADES    PREPARADO, NO EJECUTADO
-- ============================================================================
-- Siembra network_cities. Correr DESPUÉS de red_v1_identidad.sql.
--
-- Aditivo e idempotente: on conflict do nothing sobre (country_code, name,
-- admin1). Re-ejecutarlo no duplica.
--
-- COORDENADAS: centro de la ciudad, nunca de una persona. Todos los miembros
-- de una misma ciudad comparten exactamente el mismo punto — por eso el mapa
-- de La Red no puede revelar dónde vive nadie.
--
-- CÓMO AMPLIAR: este catálogo cubre el mundo hispanohablante con detalle y las
-- grandes ciudades del resto. Añadir una ciudad es un INSERT más, sin tocar
-- código ni desplegar:
--
--   insert into public.network_cities (country_code, name, admin1, lat, lon)
--   values ('EC', 'Loja', 'Loja', -3.9931, -79.2042)
--   on conflict do nothing;
--
-- name_norm lo calcula solo el trigger.
-- ============================================================================

insert into public.network_cities (country_code, name, admin1, lat, lon) values
-- ── ARGENTINA ──────────────────────────────────────────────────────────────
('AR','Buenos Aires','Ciudad Autónoma',-34.6037,-58.3816),
('AR','Córdoba','Córdoba',-31.4201,-64.1888),
('AR','Rosario','Santa Fe',-32.9442,-60.6505),
('AR','Mendoza','Mendoza',-32.8895,-68.8458),
('AR','La Plata','Buenos Aires',-34.9215,-57.9545),
('AR','San Miguel de Tucumán','Tucumán',-26.8083,-65.2176),
('AR','Mar del Plata','Buenos Aires',-38.0055,-57.5426),
('AR','Salta','Salta',-24.7821,-65.4232),
('AR','Santa Fe','Santa Fe',-31.6333,-60.7000),
('AR','San Juan','San Juan',-31.5375,-68.5364),
('AR','Neuquén','Neuquén',-38.9516,-68.0591),
('AR','Bariloche','Río Negro',-41.1335,-71.3103),
('AR','Capilla del Monte','Córdoba',-30.8578,-64.5236),
('AR','Ushuaia','Tierra del Fuego',-54.8019,-68.3030),
-- ── BOLIVIA ────────────────────────────────────────────────────────────────
('BO','La Paz','La Paz',-16.4897,-68.1193),
('BO','Santa Cruz de la Sierra','Santa Cruz',-17.7833,-63.1821),
('BO','Cochabamba','Cochabamba',-17.3895,-66.1568),
('BO','Sucre','Chuquisaca',-19.0196,-65.2619),
('BO','Oruro','Oruro',-17.9833,-67.1500),
('BO','Potosí','Potosí',-19.5836,-65.7531),
('BO','Copacabana','La Paz',-16.1667,-69.0833),
-- ── CHILE ──────────────────────────────────────────────────────────────────
('CL','Santiago','Región Metropolitana',-33.4489,-70.6693),
('CL','Valparaíso','Valparaíso',-33.0472,-71.6127),
('CL','Viña del Mar','Valparaíso',-33.0245,-71.5518),
('CL','Concepción','Biobío',-36.8270,-73.0503),
('CL','Antofagasta','Antofagasta',-23.6509,-70.3975),
('CL','La Serena','Coquimbo',-29.9027,-71.2519),
('CL','Temuco','Araucanía',-38.7359,-72.5904),
('CL','Puerto Montt','Los Lagos',-41.4693,-72.9424),
('CL','Iquique','Tarapacá',-20.2307,-70.1357),
('CL','San Pedro de Atacama','Antofagasta',-22.9087,-68.1997),
-- ── COLOMBIA ───────────────────────────────────────────────────────────────
('CO','Bogotá','Bogotá D.C.',4.7110,-74.0721),
('CO','Medellín','Antioquia',6.2442,-75.5812),
('CO','Cali','Valle del Cauca',3.4516,-76.5320),
('CO','Barranquilla','Atlántico',10.9685,-74.7813),
('CO','Cartagena','Bolívar',10.3910,-75.4794),
('CO','Bucaramanga','Santander',7.1193,-73.1227),
('CO','Pereira','Risaralda',4.8143,-75.6946),
('CO','Manizales','Caldas',5.0689,-75.5174),
('CO','Santa Marta','Magdalena',11.2408,-74.1990),
('CO','Cúcuta','Norte de Santander',7.8939,-72.5078),
('CO','Ibagué','Tolima',4.4389,-75.2322),
('CO','Villavicencio','Meta',4.1420,-73.6266),
('CO','Popayán','Cauca',2.4448,-76.6147),
('CO','Guatavita','Cundinamarca',4.9344,-73.8331),
-- ── COSTA RICA ─────────────────────────────────────────────────────────────
('CR','San José','San José',9.9281,-84.0907),
('CR','Alajuela','Alajuela',10.0162,-84.2116),
('CR','Heredia','Heredia',9.9981,-84.1197),
('CR','Cartago','Cartago',9.8644,-83.9194),
('CR','Liberia','Guanacaste',10.6346,-85.4377),
-- ── CUBA ───────────────────────────────────────────────────────────────────
('CU','La Habana','La Habana',23.1136,-82.3666),
('CU','Santiago de Cuba','Santiago de Cuba',20.0247,-75.8219),
('CU','Camagüey','Camagüey',21.3808,-77.9169),
-- ── ECUADOR ────────────────────────────────────────────────────────────────
('EC','Quito','Pichincha',-0.1807,-78.4678),
('EC','Guayaquil','Guayas',-2.1894,-79.8891),
('EC','Cuenca','Azuay',-2.9001,-79.0059),
('EC','Santo Domingo','Santo Domingo',-0.2530,-79.1750),
('EC','Ambato','Tungurahua',-1.2491,-78.6167),
('EC','Manta','Manabí',-0.9677,-80.7089),
('EC','Portoviejo','Manabí',-1.0546,-80.4545),
('EC','Loja','Loja',-3.9931,-79.2042),
('EC','Riobamba','Chimborazo',-1.6635,-78.6547),
('EC','Ibarra','Imbabura',0.3517,-78.1223),
('EC','Otavalo','Imbabura',0.2333,-78.2667),
('EC','Vilcabamba','Loja',-4.2667,-79.2167),
('EC','Baños','Tungurahua',-1.3967,-78.4247),
('EC','Puyo','Pastaza',-1.4833,-78.0000),
-- ── EL SALVADOR ────────────────────────────────────────────────────────────
('SV','San Salvador','San Salvador',13.6929,-89.2182),
('SV','Santa Ana','Santa Ana',13.9942,-89.5597),
('SV','San Miguel','San Miguel',13.4833,-88.1833),
-- ── ESPAÑA ─────────────────────────────────────────────────────────────────
('ES','Madrid','Madrid',40.4168,-3.7038),
('ES','Barcelona','Cataluña',41.3851,2.1734),
('ES','Valencia','Valencia',39.4699,-0.3763),
('ES','Sevilla','Andalucía',37.3891,-5.9845),
('ES','Zaragoza','Aragón',41.6488,-0.8891),
('ES','Málaga','Andalucía',36.7213,-4.4214),
('ES','Murcia','Murcia',37.9922,-1.1307),
('ES','Palma de Mallorca','Islas Baleares',39.5696,2.6502),
('ES','Las Palmas de Gran Canaria','Canarias',28.1235,-15.4363),
('ES','Bilbao','País Vasco',43.2630,-2.9350),
('ES','Alicante','Valencia',38.3452,-0.4810),
('ES','Córdoba','Andalucía',37.8882,-4.7794),
('ES','Valladolid','Castilla y León',41.6523,-4.7245),
('ES','Vigo','Galicia',42.2406,-8.7207),
('ES','Granada','Andalucía',37.1773,-3.5986),
('ES','Santa Cruz de Tenerife','Canarias',28.4636,-16.2518),
('ES','Pamplona','Navarra',42.8125,-1.6458),
('ES','Santander','Cantabria',43.4623,-3.8100),
('ES','San Sebastián','País Vasco',43.3183,-1.9812),
('ES','Salamanca','Castilla y León',40.9701,-5.6635),
-- ── GUATEMALA ──────────────────────────────────────────────────────────────
('GT','Ciudad de Guatemala','Guatemala',14.6349,-90.5069),
('GT','Quetzaltenango','Quetzaltenango',14.8347,-91.5181),
('GT','Antigua Guatemala','Sacatepéquez',14.5586,-90.7295),
('GT','Panajachel','Sololá',14.7411,-91.1583),
-- ── HONDURAS ───────────────────────────────────────────────────────────────
('HN','Tegucigalpa','Francisco Morazán',14.0723,-87.1921),
('HN','San Pedro Sula','Cortés',15.5041,-88.0250),
('HN','La Ceiba','Atlántida',15.7597,-86.7822),
-- ── MÉXICO ─────────────────────────────────────────────────────────────────
('MX','Ciudad de México','Ciudad de México',19.4326,-99.1332),
('MX','Guadalajara','Jalisco',20.6597,-103.3496),
('MX','Monterrey','Nuevo León',25.6866,-100.3161),
('MX','Puebla','Puebla',19.0414,-98.2063),
('MX','Tijuana','Baja California',32.5149,-117.0382),
('MX','León','Guanajuato',21.1219,-101.6833),
('MX','Querétaro','Querétaro',20.5888,-100.3899),
('MX','Mérida','Yucatán',20.9674,-89.5926),
('MX','San Luis Potosí','San Luis Potosí',22.1565,-100.9855),
('MX','Aguascalientes','Aguascalientes',21.8853,-102.2916),
('MX','Cancún','Quintana Roo',21.1619,-86.8515),
('MX','Toluca','Estado de México',19.2826,-99.6557),
('MX','Chihuahua','Chihuahua',28.6320,-106.0691),
('MX','Morelia','Michoacán',19.7060,-101.1950),
('MX','Oaxaca de Juárez','Oaxaca',17.0732,-96.7266),
('MX','Cuernavaca','Morelos',18.9186,-99.2342),
('MX','Puerto Vallarta','Jalisco',20.6534,-105.2253),
('MX','Playa del Carmen','Quintana Roo',20.6296,-87.0739),
('MX','San Cristóbal de las Casas','Chiapas',16.7370,-92.6376),
('MX','Tepoztlán','Morelos',18.9847,-99.0931),
('MX','Valle de Santiago','Guanajuato',20.3897,-101.1936),
-- ── NICARAGUA ──────────────────────────────────────────────────────────────
('NI','Managua','Managua',12.1149,-86.2362),
('NI','León','León',12.4379,-86.8780),
('NI','Granada','Granada',11.9344,-85.9560),
-- ── PANAMÁ ─────────────────────────────────────────────────────────────────
('PA','Ciudad de Panamá','Panamá',8.9824,-79.5199),
('PA','David','Chiriquí',8.4333,-82.4333),
('PA','Boquete','Chiriquí',8.7800,-82.4400),
-- ── PARAGUAY ───────────────────────────────────────────────────────────────
('PY','Asunción','Asunción',-25.2637,-57.5759),
('PY','Ciudad del Este','Alto Paraná',-25.5097,-54.6111),
('PY','Encarnación','Itapúa',-27.3306,-55.8667),
-- ── PERÚ ───────────────────────────────────────────────────────────────────
('PE','Lima','Lima',-12.0464,-77.0428),
('PE','Arequipa','Arequipa',-16.4090,-71.5375),
('PE','Trujillo','La Libertad',-8.1116,-79.0288),
('PE','Chiclayo','Lambayeque',-6.7714,-79.8409),
('PE','Cusco','Cusco',-13.5319,-71.9675),
('PE','Piura','Piura',-5.1945,-80.6328),
('PE','Iquitos','Loreto',-3.7491,-73.2538),
('PE','Huancayo','Junín',-12.0653,-75.2049),
('PE','Puno','Puno',-15.8402,-70.0219),
('PE','Tarapoto','San Martín',-6.4869,-76.3656),
('PE','Urubamba','Cusco',-13.3050,-72.1161),
('PE','Pisac','Cusco',-13.4231,-71.8492),
-- ── PUERTO RICO / REP. DOMINICANA ──────────────────────────────────────────
('PR','San Juan','San Juan',18.4655,-66.1057),
('PR','Ponce','Ponce',18.0111,-66.6141),
('DO','Santo Domingo','Distrito Nacional',18.4861,-69.9312),
('DO','Santiago de los Caballeros','Santiago',19.4517,-70.6970),
('DO','Punta Cana','La Altagracia',18.5820,-68.4055),
-- ── URUGUAY ────────────────────────────────────────────────────────────────
('UY','Montevideo','Montevideo',-34.9011,-56.1645),
('UY','Punta del Este','Maldonado',-34.9611,-54.9500),
('UY','Salto','Salto',-31.3833,-57.9667),
('UY','Colonia del Sacramento','Colonia',-34.4626,-57.8400),
('UY','Aiguá','Maldonado',-34.2000,-54.7500),
-- ── VENEZUELA ──────────────────────────────────────────────────────────────
('VE','Caracas','Distrito Capital',10.4806,-66.9036),
('VE','Maracaibo','Zulia',10.6666,-71.6124),
('VE','Valencia','Carabobo',10.1621,-68.0077),
('VE','Barquisimeto','Lara',10.0647,-69.3570),
('VE','Mérida','Mérida',8.5897,-71.1561),
('VE','Ciudad Guayana','Bolívar',8.3533,-62.6528),
('VE','Santa Elena de Uairén','Bolívar',4.6028,-61.1103),
-- ── BRASIL ─────────────────────────────────────────────────────────────────
('BR','São Paulo','São Paulo',-23.5505,-46.6333),
('BR','Rio de Janeiro','Rio de Janeiro',-22.9068,-43.1729),
('BR','Brasília','Distrito Federal',-15.7939,-47.8828),
('BR','Salvador','Bahia',-12.9777,-38.5016),
('BR','Fortaleza','Ceará',-3.7319,-38.5267),
('BR','Belo Horizonte','Minas Gerais',-19.9167,-43.9345),
('BR','Curitiba','Paraná',-25.4284,-49.2733),
('BR','Porto Alegre','Rio Grande do Sul',-30.0346,-51.2177),
('BR','Recife','Pernambuco',-8.0476,-34.8770),
('BR','Manaus','Amazonas',-3.1190,-60.0217),
('BR','Florianópolis','Santa Catarina',-27.5954,-48.5480),
('BR','Goiânia','Goiás',-16.6869,-49.2648),
('BR','Belém','Pará',-1.4558,-48.5044),
('BR','Campinas','São Paulo',-22.9099,-47.0626),
('BR','Alto Paraíso de Goiás','Goiás',-14.1319,-47.5106),
-- ── ESTADOS UNIDOS ─────────────────────────────────────────────────────────
('US','New York','New York',40.7128,-74.0060),
('US','Los Angeles','California',34.0522,-118.2437),
('US','Chicago','Illinois',41.8781,-87.6298),
('US','Houston','Texas',29.7604,-95.3698),
('US','Miami','Florida',25.7617,-80.1918),
('US','Phoenix','Arizona',33.4484,-112.0740),
('US','San Antonio','Texas',29.4241,-98.4936),
('US','San Diego','California',32.7157,-117.1611),
('US','Dallas','Texas',32.7767,-96.7970),
('US','Austin','Texas',30.2672,-97.7431),
('US','San Francisco','California',37.7749,-122.4194),
('US','Seattle','Washington',47.6062,-122.3321),
('US','Denver','Colorado',39.7392,-104.9903),
('US','Atlanta','Georgia',33.7490,-84.3880),
('US','Orlando','Florida',28.5383,-81.3792),
('US','Las Vegas','Nevada',36.1699,-115.1398),
('US','Boston','Massachusetts',42.3601,-71.0589),
('US','Washington','District of Columbia',38.9072,-77.0369),
('US','Sedona','Arizona',34.8697,-111.7610),
('US','Mount Shasta','California',41.3099,-122.3106),
-- ── CANADÁ ─────────────────────────────────────────────────────────────────
('CA','Toronto','Ontario',43.6532,-79.3832),
('CA','Montreal','Quebec',45.5017,-73.5673),
('CA','Vancouver','British Columbia',49.2827,-123.1207),
('CA','Calgary','Alberta',51.0447,-114.0719),
('CA','Ottawa','Ontario',45.4215,-75.6972),
-- ── EUROPA ─────────────────────────────────────────────────────────────────
('PT','Lisboa','Lisboa',38.7223,-9.1393),
('PT','Porto','Porto',41.1579,-8.6291),
('PT','Faro','Algarve',37.0194,-7.9304),
('FR','París','Île-de-France',48.8566,2.3522),
('FR','Marsella','Provenza',43.2965,5.3698),
('FR','Lyon','Auvernia-Ródano-Alpes',45.7640,4.8357),
('FR','Toulouse','Occitania',43.6047,1.4442),
('IT','Roma','Lacio',41.9028,12.4964),
('IT','Milán','Lombardía',45.4642,9.1900),
('IT','Nápoles','Campania',40.8518,14.2681),
('IT','Turín','Piamonte',45.0703,7.6869),
('IT','Florencia','Toscana',43.7696,11.2558),
('DE','Berlín','Berlín',52.5200,13.4050),
('DE','Múnich','Baviera',48.1351,11.5820),
('DE','Hamburgo','Hamburgo',53.5511,9.9937),
('DE','Fráncfort','Hesse',50.1109,8.6821),
('GB','Londres','Inglaterra',51.5074,-0.1278),
('GB','Manchester','Inglaterra',53.4808,-2.2426),
('GB','Edimburgo','Escocia',55.9533,-3.1883),
('NL','Ámsterdam','Holanda Septentrional',52.3676,4.9041),
('BE','Bruselas','Bruselas',50.8503,4.3517),
('CH','Zúrich','Zúrich',47.3769,8.5417),
('CH','Ginebra','Ginebra',46.2044,6.1432),
('AT','Viena','Viena',48.2082,16.3738),
('IE','Dublín','Leinster',53.3498,-6.2603),
('SE','Estocolmo','Estocolmo',59.3293,18.0686),
('NO','Oslo','Oslo',59.9139,10.7522),
('DK','Copenhague','Capital',55.6761,12.5683),
('PL','Varsovia','Mazovia',52.2297,21.0122),
('GR','Atenas','Ática',37.9838,23.7275),
-- ── OTROS ──────────────────────────────────────────────────────────────────
('AU','Sídney','Nueva Gales del Sur',-33.8688,151.2093),
('AU','Melbourne','Victoria',-37.8136,144.9631),
('NZ','Auckland','Auckland',-36.8485,174.7633),
('IL','Tel Aviv','Tel Aviv',32.0853,34.7818),
('IN','Nueva Delhi','Delhi',28.6139,77.2090),
('JP','Tokio','Tokio',35.6762,139.6503),
('ZA','Ciudad del Cabo','Cabo Occidental',-33.9249,18.4241),
('MA','Marrakech','Marrakech-Safi',31.6295,-7.9811),
('EG','El Cairo','El Cairo',30.0444,31.2357)
on conflict (country_code, name, admin1) do nothing;


-- ── Verificación (solo lectura) ────────────────────────────────────────────
select
  country_code as pais,
  count(*)     as ciudades
from public.network_cities
where is_active
group by country_code
order by count(*) desc, country_code;

-- Total esperado: 235 ciudades en 46 países.
select count(*) as total_ciudades, count(distinct country_code) as total_paises
from public.network_cities where is_active;

-- El trigger debe haber normalizado todos los nombres. Esperado: 0 filas.
select id, name, name_norm from public.network_cities where name_norm = '' or name_norm is null;
