export interface SendMailOptions {
  to: string;
  subject: string;
  template: string;
  context: any;
  from?: string;
}

export interface MailTemplateData {
  // Common fields for all templates
  name?: string;
  // Template-specific fields will be defined per template
}

export interface VerificationEmailData extends MailTemplateData {
  otpCode: string;
}

export interface PasswordResetEmailData extends MailTemplateData {
  otpCode: string;
}

export interface WelcomeEmailData extends MailTemplateData {
  storeUrl: string;
}

export interface OrderConfirmationData extends MailTemplateData {
  orderNumber: string;
  orderDate: string;
  estimatedDelivery: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  shippingAddress: string;
  orderTrackingUrl: string;
}

export interface OrderShippedData extends MailTemplateData {
  orderNumber: string;
  shippedDate: string;
  carrier: string;
  estimatedDelivery: string;
  trackingNumber: string;
  trackingUrl: string;
}

export interface OrderDeliveredData extends MailTemplateData {
  orderNumber: string;
  deliveryDate: string;
  deliveryAddress: string;
  reviewUrl: string;
}

export interface OrderCancelledData extends MailTemplateData {
  orderNumber: string;
  cancellationDate: string;
  cancellationReason: string;
  refundAmount?: number;
  refundProcessingTime?: string;
  storeUrl: string;
}

export interface AccountUpdateData extends MailTemplateData {
  updateType: string;
  updateDate: string;
  changesDescription: string;
  accountSettingsUrl: string;
}

export interface NewsletterData extends MailTemplateData {
  newsletterTitle: string;
  newsletterSubtitle: string;
  newsletterIntroduction: string;
  newsletterConclusion: string;
  featuredProducts: Array<{
    name: string;
    price: number;
    imageUrl?: string;
    url: string;
  }>;
  specialOffer?: {
    description: string;
    discount: string;
    code: string;
  };
  unsubscribeUrl: string;
  companyAddress: string;
}