import { Injectable } from '@nestjs/common';
import { ConversationContext } from './interfaces/conversation-context.interface';
import {
  SYSTEM_PROMPT_BASE,
  PRICE_INQUIRY_TEMPLATE,
  BOOKING_TEMPLATE,
  OBJECTION_HANDLING_TEMPLATE,
  PORTFOLIO_REQUEST_TEMPLATE,
} from './constants/prompts.constants';

@Injectable()
export class PromptManager {
  buildSystemPrompt(context: ConversationContext): string {
    const artistProfile = context.artistProfile;
    
    const workingHoursText = artistProfile.workingHours
      .map(wh => {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return `${days[wh.dayOfWeek]}: ${wh.startTime} - ${wh.endTime}`;
      })
      .join('\n');

    return SYSTEM_PROMPT_BASE
      .replace('{artistName}', artistProfile.name)
      .replace('{artistStyles}', artistProfile.styles.join(', '))
      .replace('{minimumPrice}', artistProfile.minimumPrice.toString())
      .replace('{hourlyRate}', (artistProfile.hourlyRate || 0).toString())
      .replace('{bookingAdvanceDays}', artistProfile.bookingAdvanceDays.toString())
      .replace('{workingHours}', workingHoursText);
  }

  buildPriceInquiryPrompt(details: {
    size?: string;
    placement?: string;
    style?: string;
    complexity?: string;
    description?: string;
  }, context: ConversationContext): string {
    return PRICE_INQUIRY_TEMPLATE
      .replace('{size}', details.size || 'No especificado')
      .replace('{placement}', details.placement || 'No especificado')
      .replace('{style}', details.style || 'No especificado')
      .replace('{complexity}', details.complexity || 'No especificado')
      .replace('{description}', details.description || 'No especificado')
      .replace('{minimumPrice}', context.artistProfile.minimumPrice.toString())
      .replace('{hourlyRate}', (context.artistProfile.hourlyRate || 0).toString());
  }

  buildBookingPrompt(details: {
    requestedDate: string;
    tattooDescription: string;
    estimatedPrice: number;
  }): string {
    const depositAmount = Math.round(details.estimatedPrice * 0.3);
    
    return BOOKING_TEMPLATE
      .replace('{requestedDate}', details.requestedDate)
      .replace('{tattooDescription}', details.tattooDescription)
      .replace('{estimatedPrice}', details.estimatedPrice.toString())
      .replace('{depositAmount}', depositAmount.toString());
  }

  buildObjectionHandlingPrompt(objection: string, conversationContext: string): string {
    return OBJECTION_HANDLING_TEMPLATE
      .replace('{objection}', objection)
      .replace('{conversationContext}', conversationContext);
  }

  buildPortfolioRequestPrompt(requestedStyle?: string, tattooType?: string): string {
    return PORTFOLIO_REQUEST_TEMPLATE
      .replace('{requestedStyle}', requestedStyle || 'Todos los estilos')
      .replace('{tattooType}', tattooType || 'Cualquier tipo');
  }
}
