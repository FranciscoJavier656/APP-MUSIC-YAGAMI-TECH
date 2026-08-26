export function getImageSrc(imageObj: any): string | undefined {
  if (!imageObj) return undefined;
  
  let url: string | undefined;

  if (typeof imageObj === 'string') {
    url = imageObj;
  } else if (typeof imageObj === 'object') {
    if (imageObj.large) url = imageObj.large;
    else if (imageObj.medium) url = imageObj.medium;
    else if (imageObj.small) url = imageObj.small;
    else if (imageObj.thumbnail) url = imageObj.thumbnail;
    else if (imageObj.root) url = imageObj.root;
  }

  if (url && url.startsWith('//')) {
    return 'https:' + url;
  }
  
  return url;
}
