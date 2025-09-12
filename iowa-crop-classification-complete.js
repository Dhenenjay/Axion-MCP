// Iowa Crop Classification using Ground Truth Data
// ================================================

// Load Iowa boundary
var iowa = ee.FeatureCollection('TIGER/2016/States')
  .filter(ee.Filter.eq('NAME', 'Iowa'));

// Define ground truth training points from the JSON data
var trainingPoints = ee.FeatureCollection([
  // Corn points (label 1)
  ee.Feature(ee.Geometry.Point([-93.6250, 41.5868]), {'crop': 1, 'cropName': 'corn', 'ndvi_peak': 0.92}),
  ee.Feature(ee.Geometry.Point([-93.5801, 42.0458]), {'crop': 1, 'cropName': 'corn', 'ndvi_peak': 0.89}),
  ee.Feature(ee.Geometry.Point([-91.5301, 41.2619]), {'crop': 1, 'cropName': 'corn', 'ndvi_peak': 0.91}),
  ee.Feature(ee.Geometry.Point([-94.1627, 42.5011]), {'crop': 1, 'cropName': 'corn', 'ndvi_peak': 0.88}),
  ee.Feature(ee.Geometry.Point([-91.3976, 40.5847]), {'crop': 1, 'cropName': 'corn', 'ndvi_peak': 0.90}),
  ee.Feature(ee.Geometry.Point([-93.3688, 43.3829]), {'crop': 1, 'cropName': 'corn', 'ndvi_peak': 0.93}),
  
  // Soybean points (label 2)
  ee.Feature(ee.Geometry.Point([-93.0519, 41.6912]), {'crop': 2, 'cropName': 'soybean', 'ndvi_peak': 0.85}),
  ee.Feature(ee.Geometry.Point([-94.6831, 42.7411]), {'crop': 2, 'cropName': 'soybean', 'ndvi_peak': 0.84}),
  ee.Feature(ee.Geometry.Point([-92.4046, 41.0381]), {'crop': 2, 'cropName': 'soybean', 'ndvi_peak': 0.86}),
  ee.Feature(ee.Geometry.Point([-94.2376, 43.0835]), {'crop': 2, 'cropName': 'soybean', 'ndvi_peak': 0.83}),
  ee.Feature(ee.Geometry.Point([-95.0172, 40.8089]), {'crop': 2, 'cropName': 'soybean', 'ndvi_peak': 0.87}),
  
  // Wheat points (label 3)
  ee.Feature(ee.Geometry.Point([-94.3831, 41.3306]), {'crop': 3, 'cropName': 'wheat', 'ndvi_peak': 0.78}),
  ee.Feature(ee.Geometry.Point([-92.1821, 42.3875]), {'crop': 3, 'cropName': 'wheat', 'ndvi_peak': 0.76}),
  ee.Feature(ee.Geometry.Point([-94.8463, 40.7392]), {'crop': 3, 'cropName': 'wheat', 'ndvi_peak': 0.79}),
  
  // Alfalfa points (label 4)
  ee.Feature(ee.Geometry.Point([-92.8073, 43.2619]), {'crop': 4, 'cropName': 'alfalfa', 'ndvi_peak': 0.82}),
  ee.Feature(ee.Geometry.Point([-91.6656, 41.9778]), {'crop': 4, 'cropName': 'alfalfa', 'ndvi_peak': 0.81}),
  
  // Pasture points (label 5)
  ee.Feature(ee.Geometry.Point([-91.0976, 42.8963]), {'crop': 5, 'cropName': 'pasture', 'ndvi_peak': 0.73}),
  ee.Feature(ee.Geometry.Point([-93.7710, 41.1636]), {'crop': 5, 'cropName': 'pasture', 'ndvi_peak': 0.72}),
  
  // Fallow points (label 6)
  ee.Feature(ee.Geometry.Point([-94.5678, 42.1234]), {'crop': 6, 'cropName': 'fallow', 'ndvi_peak': 0.25}),
  ee.Feature(ee.Geometry.Point([-92.3456, 41.4567]), {'crop': 6, 'cropName': 'fallow', 'ndvi_peak': 0.22})
]);

// Load Sentinel-2 data for the 2024 growing season (as specified in ground truth)
var sentinel2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(iowa)
  .filterDate('2024-04-01', '2024-10-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(function(image) {
    // Cloud masking
    var qa = image.select('QA60');
    var cloudBitMask = 1 << 10;
    var cirrusBitMask = 1 << 11;
    var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
    
    return image.updateMask(mask)
      .divide(10000)
      .select(['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B8A', 'B11', 'B12'])
      .copyProperties(image, ['system:time_start']);
  });

// Create median composite
var composite = sentinel2.median().clip(iowa);

// Calculate spectral indices as specified in ground truth parameters
var ndvi = composite.normalizedDifference(['B8', 'B4']).rename('NDVI');
var evi = composite.expression(
  '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))', {
    'NIR': composite.select('B8'),
    'RED': composite.select('B4'),
    'BLUE': composite.select('B2')
  }).rename('EVI');
var ndwi = composite.normalizedDifference(['B3', 'B8']).rename('NDWI');
var ndmi = composite.normalizedDifference(['B8', 'B11']).rename('NDMI');
var bsi = composite.expression(
  '((SWIR1 + RED) - (NIR + BLUE)) / ((SWIR1 + RED) + (NIR + BLUE))', {
    'SWIR1': composite.select('B11'),
    'RED': composite.select('B4'),
    'NIR': composite.select('B8'),
    'BLUE': composite.select('B2')
  }).rename('BSI');

// Combine all features as specified in ground truth
var features = composite
  .addBands(ndvi)
  .addBands(evi)
  .addBands(ndwi)
  .addBands(ndmi)
  .addBands(bsi);

// Sample the features at training points
var training = features.sampleRegions({
  collection: trainingPoints,
  properties: ['crop'],
  scale: 30,  // As recommended in ground truth
  geometries: true
});

// Train Random Forest classifier with more trees for better accuracy
var classifier = ee.Classifier.smileRandomForest({
  numberOfTrees: 100,
  variablesPerSplit: null,
  minLeafPopulation: 1,
  bagFraction: 0.5,
  maxNodes: null,
  seed: 42
}).train({
  features: training,
  classProperty: 'crop',
  inputProperties: features.bandNames()
});

// Classify the image
var classified = features.classify(classifier).rename('crop_classification');

// Define visualization parameters with crop colors
var cropColors = [
  '#FFD700',  // 1: Corn - Gold
  '#32CD32',  // 2: Soybean - Green  
  '#DEB887',  // 3: Wheat - Burlywood
  '#9370DB',  // 4: Alfalfa - Medium Purple
  '#90EE90',  // 5: Pasture - Light Green
  '#A0522D'   // 6: Fallow - Sienna
];

var visParams = {
  min: 1,
  max: 6,
  palette: cropColors
};

// Return the classified image for visualization
classified