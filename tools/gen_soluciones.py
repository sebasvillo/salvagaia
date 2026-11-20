import json,csv,re
RAT={'HR':('altamente_recomendada','Highly Recommended'),'WO':('valiosa','Worthwhile'),'KW':('seguir_mirando','Keep Watching'),'NR':('no_recomendada','Not Recommended'),'UR':('en_revision','Under Revision'),'CS':('proximamente','Coming Soon')}
ES={
"Deploy Alternative Insulation Materials":"Aislamientos alternativos","Deploy Alternative Refrigerants":"Refrigerantes alternativos","Deploy Building Automation Systems":"Edificios automatizados","Improve District Heating: Buildings":"Calefacción distrital (edificios)","Use Heat Pumps":"Bombas de calor","Use Smart & Programmable Thermostats: Heating":"Termostatos inteligentes (calefacción)","Improve Windows & Glass":"Ventanas y vidrios eficientes","Deploy Agrivoltaics":"Agrovoltaica","Deploy Distributed Solar PV":"Solar en techos","Deploy LED Lighting":"Iluminación LED","Deploy Offshore Wind Turbines":"Eólica marina","Deploy Onshore Wind Turbines":"Eólica en tierra","Deploy Utility-Scale Solar PV":"Granjas solares","Improve Cement Production: Alternative fuels":"Cemento: combustibles alternativos","Improve Cement Production: Clinker substitution":"Cemento: sustitución de clínker","Improve Cement Production: Efficiency upgrades":"Cemento: eficiencia","Increase Centralized Composting":"Compostaje municipal","Deploy Industrial Green Hydrogen":"Hidrógeno verde industrial","Improve Landfill Management: Biocovers":"Rellenos: biocubiertas","Improve Landfill Management: Methane capture":"Rellenos: captura de metano","Increase Recycling: Metals":"Reciclaje de metales","Increase Recycling: Paper and Cardboard":"Reciclaje de papel y cartón","Increase Recycling: Plastics":"Reciclaje de plásticos","Increase Carpooling":"Carro compartido","Mobilize Electric Bicycles: Private":"Bicicletas eléctricas","Mobilize Electric Cars":"Carros eléctricos","Mobilize Electric Seated Scooters & Motorcycles":"Motos eléctricas","Mobilize Hybrid Cars":"Carros híbridos","Improve Nonmotorized Transportation":"Caminar y pedalear","Enhance Public Transit":"Transporte público","Reduce Crop Residue Burning":"No quemar residuos de cosecha","Improve Diets":"Dietas basadas en plantas","Reduce Food Loss & Waste":"Cero desperdicio de comida","Improve Nutrient Management":"Manejo de nutrientes","Improve Rice Production":"Arroz mejorado","Improve Annual Cropping":"Cultivos anuales regenerativos","Protect Coastal Wetlands: Mangrove ecosystems":"Proteger manglares","Protect Coastal Wetlands: Seagrass ecosystems":"Proteger pastos marinos","Protect Forests: Boreal":"Proteger bosque boreal","Protect Forests: Subtropical":"Proteger bosque subtropical","Protect Forests: Temperate":"Proteger bosque templado","Protect Forests: Tropical":"Proteger bosque tropical","Protect Grasslands & Savannas: Boreal":"Proteger pastizales boreales","Protect Grasslands & Savannas: Temperate":"Proteger pastizales templados","Protect Grasslands & Savannas: Subtropical":"Proteger pastizales subtropicales","Protect Grasslands & Savannas: Tropical":"Proteger sabanas tropicales","Protect Peatlands: Boreal":"Proteger turberas boreales","Protect Peatlands: Temperate":"Proteger turberas templadas","Protect Peatlands: Subtropical":"Proteger turberas subtropicales","Protect Peatlands: Tropical":"Proteger turberas tropicales","Protect Seaweed Ecosystems":"Proteger bosques de algas","Restore Forests: Boreal":"Restaurar bosque boreal","Restore Forests: Temperate":"Restaurar bosque templado","Restore Forests: Subtropical":"Restaurar bosque subtropical","Restore Forests: Tropical":"Restaurar bosque tropical","Restore Peatlands: Boreal":"Restaurar turberas boreales","Restore Peatlands: Temperate":"Restaurar turberas templadas","Restore Peatlands: Subtropical":"Restaurar turberas subtropicales","Restore Peatlands: Tropical":"Restaurar turberas tropicales","Deploy Silvopasture":"Silvopastoreo","Use Biochar":"Biochar",
"Boost Appliance & Equipment Efficiency":"Electrodomésticos eficientes","Improve Building Envelopes":"Envolventes eficientes","Deploy Green Roofs":"Techos verdes","Use Low-Flow Fixtures":"Grifería de bajo flujo","Use Smart & Programmable Thermostats: Cooling":"Termostatos inteligentes (enfriamiento)","Deploy Cool Roofs":"Techos fríos","Increase Decentralized Composting":"Compostaje comunitario (pacas)","Increase Recycling: Glass":"Reciclaje de vidrio","Mobilize Electric Bicycles: Shared":"Bicicletas eléctricas compartidas","Improve Fishing Vessel Efficiency":"Barcos pesqueros eficientes","Improve Aquaculture":"Acuicultura mejorada","Deploy Electric Irrigation Pumps":"Bombas de riego eléctricas","Improve Manure Management":"Manejo de estiércol","Reduce Overfishing":"Reducir la sobrepesca","Protect Seafloors":"Proteger el fondo marino","Protect Coastal Wetlands: Salt marsh ecosystems":"Proteger marismas","Restore Grasslands & Savannas":"Restaurar pastizales y sabanas","Restore Mangrove Ecosystems":"Restaurar manglares","Restore Salt Marsh Ecosystems":"Restaurar marismas","Restore Seagrass Ecosystems":"Restaurar pastos marinos","Restore Seaweed Ecosystems":"Restaurar bosques de algas",
"Improve Fuel-Burning Cooking Equipment":"Estufas mejoradas","Deploy Electric Cooking Equipment":"Cocinas eléctricas","Deploy District Cooling":"Enfriamiento distrital","Deploy Micro Wind Turbines":"Microturbinas eólicas","Deploy Nuclear Fusion":"Fusión nuclear","Deploy Small Modular Nuclear Reactors":"Reactores nucleares modulares","Deploy Advanced Geothermal Energy":"Geotermia avanzada","Deploy Methane Digesters":"Biodigestores","Improve District Heating: Industry":"Calefacción distrital (industria)","Deploy Plastic Alternatives / Bioplastics":"Bioplásticos","Improve Steel Production":"Acero limpio","Reduce Airplane Contrails":"Reducir estelas de aviones","Mobilize Green Hydrogen for Aviation and Trucking":"Hidrógeno verde para aviones y camiones","Deploy Sustainable Aviation Fuel":"Combustible sostenible de aviación","Advance Cultivated Meat":"Carne cultivada","Use Feed Additives":"Aditivos para el ganado","Improve Irrigation Water Use Efficiency":"Riego eficiente","Deploy Leaf Protein Concentrates":"Proteína de hojas","Improve Ruminant Breeding":"Mejoramiento de rumiantes","Deploy Seaweed Farming for Food":"Cultivo de algas para comer","Deploy Alternative Grazing":"Pastoreo alternativo","Deploy Enhanced Rock Weathering":"Meteorización mejorada de rocas","Reduce Grazing Intensity":"Pastoreo menos intensivo","Restore Large Herbivores":"Restaurar grandes herbívoros","Deploy Ocean Alkalinity Enhancement":"Alcalinizar el océano","Deploy Ocean Electrochemistry":"Electroquímica oceánica","Restore Whale Populations":"Restaurar ballenas","Bury Biomass":"Enterrar biomasa","Use Methane-Oxidizing Coatings":"Recubrimientos que oxidan metano",
"Carbon Capture & Storage on Fossil Fuel Power Plants":"Captura de carbono en térmicas fósiles","Deploy Waste to Energy":"Incineración de basura con energía","Produce Blue Hydrogen":"Hidrógeno azul","Use Corn Ethanol":"Etanol de maíz","Deploy Grass-Finished Beef":"Carne de res de pastoreo","Deploy Insect Farming for Food and Feed":"Granjas de insectos","Deploy Vertical Farms":"Granjas verticales","Deploy Artificial Upwelling":"Surgencia artificial","Expand Livestock Grazing":"Expandir la ganadería","Deploy Ocean Biomass Sinking":"Hundir biomasa en el océano","Deploy Ocean Fertilization":"Fertilizar el océano","Use Atmospheric Oxidation Enhancement":"Oxidación atmosférica","Deploy Direct Air Capture":"Captura directa del aire","Deploy Stratospheric Aerosol Injection":"Aerosoles en la estratósfera",
"Manage Coal Mine Methane":"Metano de minas de carbón","Manage Oil & Gas Methane":"Metano de petróleo y gas","Use Nitrous Oxide Removal":"Remoción de óxido nitroso",
"Improve Refrigerant Management: End-of-life management":"Refrigerantes: fin de vida","Improve Refrigerant Management: Leak reduction":"Refrigerantes: menos fugas","Deploy Heat Pump Water Heaters":"Calentadores con bomba de calor","Deploy Solar Hot Water Heaters":"Calentadores solares","Deploy Concentrated Solar":"Solar de concentración","Deploy Geothermal Power":"Geotermia","Improve Grid Efficiency":"Red eléctrica eficiente","Deploy Nuclear Power":"Nuclear","Deploy Ocean Power":"Energía de las olas y mareas","Deploy Small Hydropower":"Pequeñas hidroeléctricas","Deploy Utility-Scale Hydropower":"Grandes hidroeléctricas","Boost Industrial Efficiency":"Industria eficiente","Deploy Bioelectricity With Carbon Capture & Storage":"Bioenergía con captura (BECCS)","Increase Industrial Electrification":"Electrificar la industria","Deploy Low-Emission Industrial Feedstocks":"Insumos industriales limpios","Improve Other Building Materials":"Materiales de construcción limpios","Increase Building Deconstruction & Recycling":"Desconstrucción y reciclaje de edificios","Improve Aviation Efficiency":"Aviones eficientes","Mobilize Electric Buses":"Buses eléctricos","Mobilize Electric Trains":"Trenes eléctricos","Mobilize Electric Trucks":"Camiones eléctricos","Enhance High-Speed Rail":"Tren de alta velocidad","Improve Ocean Shipping Efficiency":"Barcos de carga eficientes","Improve Supply Chain Efficiency":"Cadenas de suministro eficientes","Improve Truck Efficiency":"Camiones eficientes","Hold Virtual Meetings":"Reuniones virtuales","Deploy Advanced Biofuels":"Biocombustibles avanzados","Improve Routing & Logistics":"Logística inteligente","Improve Forest Management: Integrated Fire Management":"Manejo del fuego","Improve Forest Management: Sustainable Forest Management":"Manejo forestal sostenible","Deploy Precision Fermentation":"Fermentación de precisión","Manage & Increase Urban Trees":"Árboles urbanos","Restore Abandoned Farmland":"Restaurar tierras abandonadas","Deploy Agroforestry: Trees on Cropland":"Agroforestería: árboles en cultivos","Deploy Agroforestry: Multi-strata":"Agroforestería multiestrato (chagra)","Deploy Biomass Crops on Degraded Land":"Cultivos de biomasa en tierra degradada","Deploy Perennial Crops":"Cultivos perennes","Produce Bio Oils":"Bioaceites"}
def slug(s): return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')
def biomas(n,sec):
    n=n.lower(); b=[]
    for k,v in [('mangrove','costa'),('seagrass','oceano_costero'),('salt marsh','costa'),('seaweed','oceano_costero'),('seafloor','oceano'),('ocean','oceano'),('whale','oceano'),('fish','oceano'),('upwelling','oceano'),('offshore','oceano_costero'),('peatland','turbera'),('boreal','boreal'),('tropical','selva_tropical'),('subtropical','bosque_subtropical'),('temperate','bosque_templado'),('grassland','pastizal'),('savanna','pastizal'),('grazing','pastizal'),('herbivore','pastizal'),('silvopasture','pastizal'),('agroforestry','cultivo'),('crop','cultivo'),('rice','cultivo'),('nutrient','cultivo'),('irrigation','cultivo'),('manure','cultivo'),('ruminant','pastizal'),('feed','pastizal'),('farm','cultivo'),('beef','pastizal'),('livestock','pastizal'),('agrivoltaic','cultivo'),('rock weathering','cultivo'),('biochar','cultivo'),('urban trees','ciudad'),('hydropower','rio'),('geothermal','montaña'),('wind','pastizal'),('utility-scale solar','desierto'),('concentrated solar','desierto'),('diets','ciudad'),('food','ciudad')]:
        if k in n and v not in b: b.append(v)
    if 'subtropical' in n and 'selva_tropical' in b: b.remove('selva_tropical')
    if 'Forests' in n.title() and not b: b.append('bosque')
    if not b:
        if any(x in sec for x in ['Buildings','Transportation','Industry','Electricity','Energy']): b=['ciudad']
        else: b=['cualquiera']
    if ('Buildings' in sec or 'Transportation' in sec) and 'ciudad' not in b: b.append('ciudad')
    return b
def tipo(n,sec):
    n=n.lower()
    if n.startswith('protect'): return 'proteger'
    if n.startswith('restore') or 'CR' in sec: return 'secuestrar'
    return 'reducir'
def categoria(sec):
    if 'Electric' in sec and 'Buildings' not in sec: return 'energia'
    if 'Buildings' in sec: return 'edificios'
    if 'Transport' in sec: return 'movilidad'
    if 'Industry' in sec: return 'industria_y_residuos'
    if 'FALO' in sec and 'Nature' not in sec: return 'comida_y_tierra'
    if 'Nature' in sec: return 'naturaleza'
    if 'Industrial CR' in sec: return 'remocion_tecnologica'
    if 'Geo' in sec: return 'geoingenieria'
    return 'energia'
out=[]
for line in open('data/raw_drawdown.txt'):
    r,en,sec,lo,hi,cost=[x.strip() for x in line.rstrip('\n').split('|')]
    lo=float(lo) if lo else None; hi=float(hi) if hi else None; cost=float(cost) if cost else None
    rat=RAT[r][0]; t=tipo(en,sec); cat=categoria(sec)
    mid=(lo+hi)/2 if lo is not None else None
    # ---- reglas de juego v0 ----
    trampa = rat=='no_recomendada'
    if rat=='altamente_recomendada': era = 1 if (cost is not None and cost<=10) else 2
    elif rat=='valiosa': era=2
    elif rat in ('proximamente','en_revision'): era=3
    elif rat=='seguir_mirando': era=4
    else: era=1  # las trampas aparecen temprano: son tentadoras
    if 'Fusion' in en: era=5
    pot = mid if mid is not None else (0.3 if not trampa else 0.6)  # supuesto de juego si Drawdown no da número
    pot_supuesto = mid is None
    # costo en el juego: base por potencial + castigo por costo US$/t
    c_base = 10 + 40*min(pot,5)/5
    if cost is not None and cost>100: c_base*=1.5
    if cost is not None and cost<0: c_base*=0.8
    usa_mat = cat in ('energia','edificios','movilidad','industria_y_residuos','remocion_tecnologica','geoingenieria')
    costo={'energia': round(c_base*(0.3 if usa_mat else 0.1)), 'materiales': round(c_base*(0.7 if usa_mat else 0.2))}
    produce={'energia':0,'materiales':0}
    if cat=='energia' and t=='reducir' and not trampa: produce['energia']=round(5+10*min(pot,10)/10)
    if 'Recycling' in en or 'Deconstruction' in en or 'Composting' in en: produce['materiales']=round(3+5*min(pot,2)/2)
    vida = 0
    if t in ('proteger','secuestrar') and cat=='naturaleza': vida = 3 if t=='proteger' else 2
    if 'Diets' in en or 'Food Loss' in en or 'Agroforestry' in en or 'Silvopasture' in en or 'Composting' in en: vida=max(vida,1)
    comunidad = 1 if (cat in ('movilidad','comida_y_tierra') or 'Composting' in en or 'Distributed Solar' in en or 'Urban Trees' in en) else 0
    ocultos={}
    if trampa:
        costo={k:max(3,round(v*0.5)) for k,v in costo.items()}
        ocultos={'vida':-2,'comunidad':-1,'lock_in_fosil': 1 if any(x in en for x in ['Fossil','Blue Hydrogen','Waste to Energy','Corn']) else 0,'riesgo':'efecto aparente rápido; costos ocultos que se revelan con los años'}
        vida=0
        if 'Aerosol' in en: ocultos.update({'riesgo':'enfría rápido pero no baja el CO₂; si se suspende, choque de terminación','vida':-3})
        if 'Direct Air' in en: ocultos.update({'riesgo':'muy cara en energía; compite con la electrificación','vida':0,'comunidad':0})
    out.append({'id':slug(en),'nombre_es':ES.get(en,en),'nombre_en':en,'sector_drawdown':sec,'categoria_juego':cat,'tipo':t,
      'calificacion_drawdown':rat,'calificacion_drawdown_en':RAT[r][1],
      'potencial_gt_min':lo,'potencial_gt_max':hi,'costo_usd_t':cost,
      'juego':{'era':era,'biomas':biomas(en,sec),'potencial_gt_usado':round(pot,3),'potencial_es_supuesto':pot_supuesto,
               'costo':costo,'produce':produce,'efecto_vida':vida,'efecto_comunidad':comunidad,'es_trampa':trampa,'efectos_ocultos':ocultos,
               'niveles':5,'adopcion':'curva_s'},
      'fuente':'Project Drawdown, Drawdown Explorer (actualizado 22 sep 2025), transcrito el 7 nov 2026; verificar contra el CSV oficial'})
json.dump(out,open('data/soluciones.json','w'),ensure_ascii=False,indent=1)
with open('data/soluciones.csv','w',newline='') as f:
    w=csv.writer(f); w.writerow(['id','nombre_es','nombre_en','sector_drawdown','calificacion','potencial_min','potencial_max','costo_usd_t','era','biomas','es_trampa'])
    for s in out: w.writerow([s['id'],s['nombre_es'],s['nombre_en'],s['sector_drawdown'],s['calificacion_drawdown'],s['potencial_gt_min'],s['potencial_gt_max'],s['costo_usd_t'],s['juego']['era'],';'.join(s['juego']['biomas']),s['juego']['es_trampa']])
from collections import Counter
print(len(out), Counter(s['calificacion_drawdown'] for s in out), Counter(s['juego']['era'] for s in out))
print([s['nombre_en'] for s in out if s['nombre_es']==s['nombre_en']])
print(sorted(Counter(b for s in out for b in s['juego']['biomas']).items()))
