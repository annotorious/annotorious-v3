export interface IIIFAnnotation {

  '@context': string;

  '@id': string;

  '@type': string;

  motivation: string;

  on: {
    '@type': string | Array<string>;

    selector: {
      '@type': string;

      value: string;
    };
  };

  resource: IIIFResource;

}

export interface IIIFResource {

  '@type': string | Array<string>;

  format: string;

  chars?: string;
  
}
