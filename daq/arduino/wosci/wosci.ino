#define N_VALS 512

#define enableADCInterrupt() (ADCSRA |= (1 << ADIE))
#define disableADCInterrupt() (ADCSRA &= ~(1 << ADIE))

//#define USE_ADC_8BIT 1

#define ADC_CONVERSION_IN_PROGRESS (ADCSRA&(1<<ADSC))
#ifdef USE_ADC_8BIT
# define ADC_CONVERSION_REG (ADCH)
#else
# define ADC_CONVERSION_REG (ADC)
#endif

#ifdef USE_ADC_8BIT
typedef unsigned char adc_t;
#else
typedef unsigned int adc_t;
#endif

int index = 0;
adc_t vals[N_VALS];
volatile char kickout = 0;

#define ADC_MODE_OFF    (0)
#define ADC_MODE_BUFFER (1)
#define ADC_MODE_STREAM (2)

char adc_mode = ADC_MODE_OFF;

int t_start = 0;

void setupADC(char mode)
{
  adc_mode = mode;
  
  /* Clear registers */
  ADCSRA = 0;
  ADCSRB = 0;
  ADMUX  = 0;

  /* Set ADMUX register */
  ADMUX |= (0 & 0x07);    // set A0 analog input pin
  ADMUX |= (1 << REFS0);  // set reference voltage
#ifdef USE_ADC_8BIT
  ADMUX |= (1 << ADLAR);  // left align ADC value to 8 bits from ADCH register
#endif

  /* Set ADC mode specific values */
  if( mode == ADC_MODE_OFF )
  {
    ADCSRA = 0;
  }
  else if( adc_mode == ADC_MODE_BUFFER )
  {
    ADCSRA |= (6<<ADPS0);
    ADCSRA |= (1 << ADATE); // enable auto trigger
    ADCSRA |= (1 << ADIE);  // enable interrupts when measurement complete
    ADCSRA |= (1 << ADEN);  // enable ADC
    ADCSRA |= (1 << ADSC);  // start ADC measurements
  }
  else if( adc_mode == ADC_MODE_STREAM )
  {
    ADCSRA |= (1<<ADPS2);
    ADCSRA |= (1 << ADEN);  // enable ADC
    ADCSRA |= (1 << ADSC);  // start ADC measurement
  }

  // sampling rate is [ADC clock] / [prescaler] / [conversion clock cycles]
  // for Arduino Uno ADC clock is 16 MHz and a conversion takes 13 clock cycles
  //ADCSRA |= (7<<ADPS0);
  //ADCSRA |= (1 << ADPS2) | (1 << ADPS0);    // 32 prescaler for 38.5 KHz
  //ADCSRA |= (1 << ADPS2);                     // 16 prescaler for 76.9 KHz
  //ADCSRA |= (1 << ADPS1) | (1 << ADPS0);    // 8 prescaler for 153.8 KHz

  /* Initialize array */
  for(int i = 0; i < N_VALS; i++)
  {
    vals[i] = 0;
  }  
}

adc_t ADCSingleShot()
{
  ADCSRA |= (1<<ADSC);
  while( ADC_CONVERSION_IN_PROGRESS );
  return ADC_CONVERSION_REG;
}

void setup()
{
  Serial.begin(500000);

  //setupADC( ADC_MODE_BUFFER );
}

ISR(ADC_vect)
{
  adc_t x = ADC_CONVERSION_REG;

  vals[index] = x;
  //vals[index] = micros() - t_start;
  //t_start = micros();
  if(++index >= N_VALS)
  {
    index = 0;
    kickout = 1;
  }
}

void loop()
{
  static unsigned long t_diff = 0;
  static unsigned long t_start = 0;
  static unsigned long t_end = 0;
  
  if( adc_mode == ADC_MODE_OFF )
  {
    Serial.println("ADC turned off...");
    delay(1000);
    setupADC( ADC_MODE_STREAM );
  }
  
  else if( adc_mode == ADC_MODE_STREAM )
  {
    if( (long)( micros() - t_end) >= 0)
    {
      t_start = micros();
      t_end   = t_start + 1000 - 6;
      
      adc_t adc_val = ADCSingleShot();
      //Serial.print(t_start);
      //Serial.print(" ");
      Serial.println(adc_val);
    }
  }
  
  else if( adc_mode == ADC_MODE_BUFFER )
  {
    if(kickout > 0)
    {
      disableADCInterrupt();
      
      kickout = 0;
  
      for(int i = 0; i < N_VALS; i++)
      {
        Serial.println(vals[i]);
      }
      
      enableADCInterrupt();
    }
  }
}
