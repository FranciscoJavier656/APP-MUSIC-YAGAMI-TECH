export function getImageSrc(imageObj: any): string | undefined {
  if (!imageObj) return undefined;
  if (typeof imageObj === 'string') return imageObj;
  
  if (typeof imageObj === 'object') {
    if (imageObj.large) return imageObj.large;
    if (imageObj.medium) return imageObj.medium;
    if (imageObj.small) return imageObj.small;
    if (imageObj.thumbnail) return imageObj.thumbnail;
    if (imageObj.root) return imageObj.root;
  }
  
  return undefined;
}
