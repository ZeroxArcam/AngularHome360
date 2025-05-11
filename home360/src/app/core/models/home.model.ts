export interface HomeRequest {
  name: string;
  address: string;
  description: string;
  category: string;
  numberOfRooms: number;
  numberOfBathrooms: number;
  price: number;
  cityId: number;
  activePublicationDate: Date;
  publicationDate: Date;

}

export interface HomeResponse {
  message: string;
  time: string;
}
