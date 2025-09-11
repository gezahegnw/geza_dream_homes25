import { Home, ShieldCheck, TrendingUp, Handshake } from 'lucide-react';

const features = [
  {
    icon: <Home className="h-10 w-10 text-brand" />,
    title: 'Local Expertise',
    description: 'Deep knowledge of the Kansas City real estate market and neighborhoods.'
  },
  {
    icon: <ShieldCheck className="h-10 w-10 text-brand" />,
    title: 'Trusted Guidance',
    description: 'Honest advice and expert negotiation to get you the best deal.'
  },
  {
    icon: <TrendingUp className="h-10 w-10 text-brand" />,
    title: 'Market Knowledge',
    description: 'Up-to-date with current market trends and property values.'
  },
  {
    icon: <Handshake className="h-10 w-10 text-brand" />,
    title: 'Personalized Service',
    description: 'Dedicated to understanding and meeting your unique real estate needs.'
  }
];

export default function WhyChooseUs() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
            Why Choose Geza Dream Homes
          </h2>
          <p className="mb-12 text-lg text-gray-600">
            With a passion for real estate and unwavering dedication to my clients, I'm committed to helping you find your dream home or get the best value for your property.
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div key={index} className="rounded-xl bg-gray-50 p-6 text-center">
              <div className="mb-4 flex justify-center">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <a 
            href="/about" 
            className="inline-block rounded-lg border-2 border-brand bg-transparent px-8 py-3 font-medium text-brand hover:bg-brand/5"
          >
            Learn More About Me
          </a>
        </div>
      </div>
    </section>
  );
}
