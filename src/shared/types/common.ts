export type Metadata = Record<string, unknown>;

export type Address = {
  street?: string;
  externalNumber?: string;
  internalNumber?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  references?: string;
};

export type Contact = {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
};
