// import RNFetchBlob from 'rn-fetch-blob';
import {v4 as uuidv4} from 'uuid';
import {Platform} from 'react-native';
import * as mime from 'mime';
import * as Sentry from '@sentry/react-native';
import * as FileSystem from 'expo-file-system';

export const wait = ms => new Promise(r => setTimeout(r, ms));

export const retryOperation = async (operation, delay, retries) =>{
  return await new Promise((resolve, reject) => {
    return operation()
      .then(resolve)
      .catch(reason => {
        console.log(
          'Task failed retries left: ',
          retries,
          ' reason: ' + reason,
        );
        if (retries > 0) {
          return wait(delay)
            .then(retryOperation.bind(null, operation, delay, retries - 1))
            .then(resolve)
            .catch(reject);
        }
        return reject(reason);
      });
  });
}
  

export const uploadToCFASBase64 = (
  imagePutUrl: any,
  mimeType: any,
  imageBase64: any,
) => {
  return RNFetchBlob.fetch(
    'PUT',
    imagePutUrl,
    {
      'Content-Type': `${mimeType};BASE64`,
    },
    imageBase64,
  )
    .then(data => {
      console.log('Successfull upload response...');
      if (data.respInfo.status != 200) {
        console.log('Error on CloudFlare file upload', data);
      } else {
        console.log('File uploaded successfully!');
        // queryClient.invalidateQueries(['products-list'])
      }
    })
    .catch(error => {
      console.log('Error on file upload', error);
    });
};

export const uploadToCFFromPath = async (
    note_id: string,
    imagePutUrl: string, // Changed `any` to `string` for clarity
    defaultMimeType: string, // Changed `any` to `string`
    imagePath: string, // Changed `any` to `string`
  ) => {
    // Normalize file path (Expo usually handles file:// correctly, but we ensure compatibility)
    const platformPath = Platform.OS === 'ios' ? imagePath?.replace('file://', '') : imagePath;
    console.log('Platform from to upload:', platformPath);
    // Get file metadata (size)
    let size: number | undefined;
    try {
      const fileInfo = await FileSystem.getInfoAsync(imagePath);
      if (!fileInfo.exists || fileInfo.isDirectory) {
        throw new Error('File does not exist or is a directory');
      }
      size = fileInfo.size;
    } catch (err) {
      console.warn('Error getting file info:', err);
      Sentry.captureException(err, {
        extra: {
          image_path: platformPath,
          note_id: note_id
        },
      });
      console.warn('File probably does not exist:', platformPath);
      throw err;
    }
  
    // Determine MIME type
    const mimeType = mime.default.getType(platformPath) || defaultMimeType;
  
    // Perform the upload with retry logic
    try {
      const response = await retryOperation(
        async () => {
          // Read file as a blob-like structure (Expo file URI can be used directly with fetch)
          const response = await fetch(imagePutUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': mimeType,
            },
            body: {
              uri: imagePath, // Expo fetch handles file:// URIs correctly
              type: mimeType,
              name: imagePath.split('/').pop() || 'file', // Extract filename
            },
          });
  
          if (!response.ok) {
            throw new Error(
              `Upload failed with status ${response.status}: ${await response.text()}`,
            );
          }
  
          return response;
        },
        1500,
        3,
      );
  
      // Handle success
      console.log(
        'File uploaded successfully!',
        note_id,
        platformPath,
        ((size || 0) / 1024).toFixed(2) + ' KB',
      );
      // Optionally invalidate queries or update cache
      // queryClient.invalidateQueries(['products-list']);
  
      return response;
    } catch (error: any) {
      console.warn('Error on file upload:', error, platformPath);
      Sentry.captureException(error, {
        extra: {
          image_path: platformPath,
          note_id: note_id,
        },
      });
      throw error;
    }
  };

export const parseTimestampFromImageName = (imageName: string | undefined) => {
  //example products/b30e5d04-abed-4147-8e9e-e2cdcb81581c-1703681486878-local_filename.jpg
  // in milliseconds

  // console.log(imageName, ' parse timestamp')
  try {
    if (!imageName) {
      return 0;
    }
    const fileNameChunks = imageName?.split('-');

    if (fileNameChunks.length > 0) {
      const localFilaName = fileNameChunks.pop();
      const ts = fileNameChunks.pop();
      if (!ts) {
        console.log('No timestamp info in image name!', imageName);
        return -1;
      }
      return (ts && parseInt(ts)) || 0;
    } else {
      console.log('No timestamp info in image name!', imageName);
      return 0;
    }
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        image_name: imageName,
        // chunks:
      },
    });
    return 0;
  }
};


// export const getOrCacheImage = async (
//   imageId : string,
//   product: Product,
//   setIsLoading: (value: boolean) => undefined
// ) => {

//     const commonStore = useCommonStore.getState()
//     const isInternetConnected = commonStore.isInternetConnected

//     if (!isInternetConnected){
//       return false
//     }
//     const imgUriCache = imageStorage.getString(imageId)
//     const platformPath = !!imgUriCache ? Platform.OS == 'ios' ? imgUriCache.replace('file://', '') : imgUriCache : '';
//     const storageExists = await RNFetchBlob.fs.exists(platformPath)
//     let newUri = undefined
//     if ((imgUriCache && storageExists) || !imgUriCache) {
//       if (setIsLoading)
//         setIsLoading(true)
//       const existingTs = imageUpdatedTSIndex.getNumber(product.id)
//       if (product.imageUrl) {
//         const newTs = parseTimestampFromImageName(product.imageUrl)
//         if (existingTs) {
//           // console.log('new', product.imageUrl, ' existing ', existingTs, product.imageUrl)
//           if (newTs > existingTs) {
//             try {

//               newUri = await saveImageURLToFileCache(product.imageUrl, product.id)
//               imageUpdatedTSIndex.set(product.id, newTs)
//             } catch (error) {
//               console.log(error, " Failed to save ")
//               Sentry.captureException(error, {
//                 extra: {
//                   "product_id": product.id,
//                   "imageUrl": product.imageUrl
//                 }
//               })
//             }
//             // console.debug("Image outdated for ", prod.id, prod.imageUrl, existingTs)
//           }
//         } else {
//           try {

//             newUri = await saveImageURLToFileCache(product.imageUrl, product.id)
//             imageUpdatedTSIndex.set(product.id, newTs)
//           } catch (error) {
//             Sentry.captureException(error, {
//               extra: {
//                 "product_id": product.id,
//                 "imageUrl": product.imageUrl
//               }
//             })
//           }
//           // console.debug("New image set, update ", prod.id, prod.image_uri, existingTs)
//         }
//       } else {
//         imageStorage.set(product.id, "")
//         imageUpdatedTSIndex.set(product.id, Date.now())
//       }
//       if (setIsLoading){
//         // console.log('image id ', imageId, ' loading false' , )
//         setIsLoading(false)
//       }
//       return newUri
//     } else {

//     }

  
// }

// export const saveImageURLToFileCache = async (
//   imageUrl: string,
//   productId: string,
//   setImageValue: ((value: string) => undefined) | undefined = undefined
// ) => {
//   const url = 'https://fastposassets.com/' + imageUrl;
//   return await retryOperation(
//     async () => {
//       return RNFetchBlob.config({
//         // add this option that makes response data to be stored as a file,
//         // this is much more performant.
//         fileCache: true,
//       }).fetch('GET', url, {
//         //some headers ..
//       }).then(data => {
//         if (data.respInfo.status != 200) {
//           throw new Error(
//             'file fetch url: ' +
//               imageUrl + 
//               ' status: ' +
//               data.respInfo.status +
//               ' data: ' +
//               data.data,
//           );
//         }
//         return data;
//       });;
//     },
//     3000,
//     3,
//   ).then(res => {
//     // the temp file path
//     const filePath = res.path();
//     // console.debug('The file saved to ', filePath);
//     // throw new Error("Hello")
//     // if (setImageValue){
//     //   setImageValue('file://' + filePath)
//     // } else{

//     imageStorage.set(productId, 'file://' + filePath);

//     return 'file://' + filePath
//     // console.log(productId, 'set image id!!')
//     // }
//   });
// };

// export const labelaryUpload = (
//   widthInch: number,
//   heightInch: number,
//   data: any,
//   onSuccess: (result: string) => void,
// ) => {
//   const widthFormat = widthInch.toFixed(2);
//   const heightFormat = heightInch.toFixed(2);
//   return RNFetchBlob.fetch(
//     'POST',
//     `https://api.labelary.com/v1/printers/8dpmm/labels/${widthFormat}x${heightFormat}/0/`,
//     {
//       'Content-Type': 'multipart/form-data',
//     },
//     [
//       {
//         name: 'file',
//         filename: 'code.zpl',
//         data: data,
//       },
//     ],
//   )
//     .then(data => {
//       console.log('Labelary response: ', data.data.length);
//       if (onSuccess) onSuccess(data.data);
//     })
//     .catch(error => {
//       console.log('Error on file upload', error);
//     });
// };

// export const textEllipsis = (input: string, maxLength = 5) => {
//   if (input.length > maxLength) {
//     return input.substring(0, maxLength) + '...';
//   }
//   return input;
// };

// function randomNumber(min: number, max: number) {
//   return ~~(Math.random() * (max - min) + min);
// }

// export const generateProducts = async (
//   database: Database,
//   n: number,
//   // fullStockMode: boolean,
//   t: any,
// ) => {
//   const tags = await database.get(Tag.table).query().fetch();
//   for (var i = 0; i < n; i++) {
//     console.log("progress ", i , " out of ", n)
//     const productIn: ProductIn = {
//       name: 'Gen ' + i,
//       barcode: randomNumber(1000000, 9999999).toString(),
//       salesPrice: randomNumber(50, 1000),
//       costPrice: randomNumber(10, 50),
//       stockCount: randomNumber(3, 55),
//       uniqueId: uuidv4(),
//       sku: '',
//       tags: [tags[randomNumber(0, tags.length)].id],
//       // tags: [],
//       unlimitedStock: false,
//       discountPercent: 0,
//       createdUserId: '999',
//       // createdById: '999',
//       imageUrl: '',
//       imageUri: '',
//       category: 'ring',
//       weight: 1.2,
//       notes: 'Notes',
//       unitType: 'pcs',
//       deletedAt: null,
//     };
//     await saveProduct(database, null, productIn, t);
//   }
// };

// // Used to compile ZPL template based on variables
// export const compileZplTemplate = (
//   barcode: string,
//   printerSettings: PrinterSettings,
// ) => {
//   console.log(printerSettings);
//   return LABEL_PRINTER_ZPL_TEMPLATE.replace(
//     '{topMargin}',
//     printerSettings.topMargin.toString(),
//   )
//     .replace(
//       '{leftMargin}',
//       (-1 * parseInt(printerSettings.leftMargin.toString())).toString(),
//     )
//     .replace(
//       '{barcodeSettings}',
//       ZPL_BARCODE_TEMPLATE[printerSettings.barcodeType].toString(),
//     )
//     .replace(
//       '{barcodeStart}',
//       barcode || printerSettings.barcodeStart.toString(),
//     )
//     .replace('{barcodeTop}', printerSettings.barcodeTop.toString())
//     .replace('{barcodeLeft}', printerSettings.barcodeLeft.toString())
//     .replace('{textLeft}', printerSettings.textLeft.toString())
//     .replace('{textLeft}', printerSettings.textLeft.toString())
//     .replace('{textTop}', printerSettings.textTop.toString())
//     .replace('{textTop2}', (printerSettings.textTop + 33).toString())
//     .replace('{textSize}', printerSettings.textSize.toString())
//     .replace('{textSize2}', printerSettings.textSize2.toString())
//     .replace('{text1}', printerSettings.text1)
//     .replace('{text2}', printerSettings.text2);
// };

// export async function promiseAllInBatches(
//   task,
//   items,
//   batchSize,
//   onBatchFinish,
// ) {
//   let position = 0;
//   let results = [];
//   while (position < items.length) {
//     const itemsForBatch = items.slice(position, position + batchSize);
//     results = [
//       ...results,
//       ...(await Promise.all(itemsForBatch.map(item => task(item, position)))),
//     ];
//     position = Math.min(position + batchSize, items.length);
//     if (onBatchFinish) {
//       onBatchFinish(position);
//     }
//   }
//   return results;
// }


// // This will parse a delimited string into an array of
// 	// arrays. The default delimiter is the comma, but this
// 	// can be overriden in the second argument.
// export const  CSVToArray = ( strData, strDelimiter ) => {
// 		// Check to see if the delimiter is defined. If not,
// 		// then default to comma.
// 		strDelimiter = (strDelimiter || ",");

// 		// Create a regular expression to parse the CSV values.
// 		var objPattern = new RegExp(
// 			(
// 				// Delimiters.
// 				"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

// 				// Quoted fields.
// 				"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

// 				// Standard fields.
// 				"([^\"\\" + strDelimiter + "\\r\\n]*))"
// 			),
// 			"gi"
// 			);


// 		// Create an array to hold our data. Give the array
// 		// a default empty first row.
// 		var arrData = [[]];

// 		// Create an array to hold our individual pattern
// 		// matching groups.
// 		var arrMatches = null;


// 		// Keep looping over the regular expression matches
// 		// until we can no longer find a match.
// 		while (arrMatches = objPattern.exec( strData )){

// 			// Get the delimiter that was found.
// 			var strMatchedDelimiter = arrMatches[ 1 ];

// 			// Check to see if the given delimiter has a length
// 			// (is not the start of string) and if it matches
// 			// field delimiter. If id does not, then we know
// 			// that this delimiter is a row delimiter.
// 			if (
// 				strMatchedDelimiter && strMatchedDelimiter.length &&
// 				(strMatchedDelimiter != strDelimiter)
// 				){

// 				// Since we have reached a new row of data,
// 				// add an empty row to our data array.
// 				arrData.push( [] );

// 			}


// 			// Now that we have our delimiter out of the way,
// 			// let's check to see which kind of value we
// 			// captured (quoted or unquoted).
// 			if (arrMatches[ 2 ]){

// 				// We found a quoted value. When we capture
// 				// this value, unescape any double quotes.
// 				var strMatchedValue = arrMatches[ 2 ].replace(
// 					new RegExp( "\"\"", "g" ),
// 					"\""
// 					);

// 			} else {

// 				// We found a non-quoted value.
// 				var strMatchedValue = arrMatches[ 3 ];

// 			}


// 			// Now that we have our value string, let's add
// 			// it to the data array.
// 			arrData[ arrData.length - 1 ].push( strMatchedValue );
// 		}

// 		// Return the parsed data.
// 		return( arrData );
// 	}

//  export const base64ToArrayBuffer = (base64) => {
//    return Buffer.from(base64, 'base64');
// }

// export const toHexString = (byteArray) => {
//   return Array.from(byteArray, function(byte) {
//     return ('0' + (byte & 0xFF).toString(16)).slice(-2);
//   }).join('')
// }
