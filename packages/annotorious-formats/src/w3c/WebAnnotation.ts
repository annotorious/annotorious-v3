export interface WebAnnotation {

  id: string;

  body: Object | Array<Object>;

  target: WebAnnotationTarget | Array<WebAnnotationTarget>;

  [key: string]: any;

}

export interface WebAnnotationBody {

  type?: string;

  purpose?: string;

  value?: string;

  created?: Date;

  creator?: {

    id: string;

    name?: string;

  };

}

export interface WebAnnotationTarget {

  source: string;

  selector: Selector | Array<Selector>;

}

export interface Selector {

  type: string;

  conformsTo?: string;

  value: string;
}

