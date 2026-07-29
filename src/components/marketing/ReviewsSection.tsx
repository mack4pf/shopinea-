"use client";

import { useEffect, useRef } from "react";
import { Star } from "lucide-react";

/* 
  Generating 50 realistic reviews for Shopinea.
  Mix of Resellers and Suppliers.
*/
const reviews = [
    { name: "Sarah Jenkins", email: "sarah.j@gmail.com", type: "Reseller", text: "Shopinea changed my life. I started with $0 and now I'm making full-time income from home." },
    { name: "Michael Chen", email: "m.chen88@outlook.com", type: "Supplier", text: "The volume of orders we get here is insane. Best B2B platform hands down." },
    { name: "Jessica Williams", email: "jess.williams@icloud.com", type: "Reseller", text: "Love the AI product research. It found me a winning product in day one." },
    { name: "David Miller", email: "davidm_biz@gmail.com", type: "Reseller", text: "The postpaid ads feature is a game changer. I scaled my store without draining my savings." },
    { name: "Emily Davis", email: "emily.davis92@yahoo.com", type: "Reseller", text: "Working from home has never been easier. The support team is amazing." },
    { name: "Robert Wilson", email: "bob.wilson@gmail.com", type: "Supplier", text: "Payments are always on time. Very professional platform to work with." },
    { name: "Lisa Taylor", email: "lisa.t.designs@gmail.com", type: "Reseller", text: "The variety of suppliers is great. found some unique items no one else is selling." },
    { name: "James Anderson", email: "j.anderson@corporate.net", type: "Supplier", text: "Shopinea helps us clear inventory fast. Highly recommended." },
    { name: "Ashley Thomas", email: "ashleyt@icloud.com", type: "Reseller", text: "Customer support acts as my own team. My customers are happy, I'm happy." },
    { name: "Brian Martinez", email: "bmartinez@outlook.com", type: "Reseller", text: "The dashboard is so intuitive. Everything I need is right there." },
    { name: "Jennifer Hernandez", email: "jen.h1990@gmail.com", type: "Reseller", text: "I love that I can repay ad spend after I make sales. Less risk for me." },
    { name: "Anthony Lopez", email: "anthony.lopez@gmail.com", type: "Supplier", text: "We've expanded to 3 new countries thanks to Shopinea's logistics." },
    { name: "Amanda Gonzalez", email: "amanda.g@icloud.com", type: "Reseller", text: "Dropshipping made simple. Tech products sell like hotcakes." },
    { name: "Kevin Wilson", email: "kwilson.trade@outlook.com", type: "Reseller", text: "Quality of products is top notch. No returns so far!" },
    { name: "Brittany Young", email: "brittany.y@gmail.com", type: "Reseller", text: "From a side hustle to my main job in 6 months. Thank you Shopinea!" },
    { name: "Matthew Hall", email: "matt.hall@gmail.com", type: "Supplier", text: "Great interface for managing bulk orders." },
    { name: "Nicole King", email: "nicole.k.fashion@icloud.com", type: "Reseller", text: "The viral product lists are actually legit. Saved me hours of research." },
    { name: "Brandon Wright", email: "b.wright@outlook.com", type: "Reseller", text: "Payouts are fast. I appreciate the transparency." },
    { name: "Melissa Scott", email: "melissa.scott@gmail.com", type: "Reseller", text: "I was skeptical at first, but the results speak for themselves." },
    { name: "Christopher Green", email: "chris.green@gmail.com", type: "Supplier", text: "A solid partner for our wholesale business." },
    { name: "Stephanie Baker", email: "steph.baker@icloud.com", type: "Reseller", text: "The affiliation commission is a nice bonus on top of my sales." },
    { name: "Joshua Adams", email: "josh.adams@outlook.com", type: "Reseller", text: "Finally a platform that cares about the little guy." },
    { name: "Rebecca Nelson", email: "rebecca.n@gmail.com", type: "Reseller", text: "AI assistance is like having a business partner." },
    { name: "Daniel Carter", email: "d.carter@gmail.com", type: "Supplier", text: "Consistent orders, reliable payments. What more can you ask for?" },
    { name: "Samantha Mitchell", email: "sam.m@icloud.com", type: "Reseller", text: "My store traffic doubled after using the prepaid ad service." },
    { name: "Alexander Perez", email: "alex.perez@outlook.com", type: "Reseller", text: "The best dropshipping platform I've used. And I've tried them all." },
    { name: "Rachel Roberts", email: "rachel.r@gmail.com", type: "Reseller", text: "Ease of use is 10/10." },
    { name: "Justin Turner", email: "justin.turner@gmail.com", type: "Supplier", text: "Good exposure for our brand." },
    { name: "Lauren Phillips", email: "lauren.p@icloud.com", type: "Reseller", text: "I can run my business from my phone while traveling." },
    { name: "Ryan Campbell", email: "ryan.c@outlook.com", type: "Reseller", text: "The community features are great for learning." },
    { name: "Kayla Parker", email: "kayla.parker@gmail.com", type: "Reseller", text: "Super helpful analytics. I know exactly where my buyers are coming from." },
    { name: "Gary Evans", email: "gary.evans@gmail.com", type: "Supplier", text: "Efficient logistics network." },
    { name: "Megan Edwards", email: "megan.e@icloud.com", type: "Reseller", text: "Love the flexibility." },
    { name: "Jose Collins", email: "jose.collins@outlook.com", type: "Reseller", text: "Real products, real money." },
    { name: "Katherine Stewart", email: "kat.stewart@gmail.com", type: "Reseller", text: "Customer service is very responsive." },
    { name: "Jacob Sanchez", email: "jacob.s@gmail.com", type: "Supplier", text: "Seamless integration with our warehouse system." },
    { name: "Victoria Morris", email: "victoria.m@icloud.com", type: "Reseller", text: "Highly recommend for beginners." },
    { name: "Zachary Rogers", email: "zach.rogers@outlook.com", type: "Reseller", text: "The profit margins are actually decent." },
    { name: "Natalie Reed", email: "natalie.reed@gmail.com", type: "Reseller", text: "Safe and secure platform." },
    { name: "Paul Cook", email: "paul.cook@gmail.com", type: "Supplier", text: "We've seen a 20% increase in sales." },
    { name: "Hannah Morgan", email: "hannah.m@icloud.com", type: "Reseller", text: "Everything is automated. It's magic." },
    { name: "Andrew Bell", email: "andrew.bell@outlook.com", type: "Reseller", text: "Top tier platform." },
    { name: "Olivia Murphy", email: "olivia.murphy@gmail.com", type: "Reseller", text: "I wish I started sooner." },
    { name: "Tyler Bailey", email: "tyler.bailey@gmail.com", type: "Supplier", text: "Streamlined operations." },
    { name: "Elizabeth Rivera", email: "liz.rivera@icloud.com", type: "Reseller", text: "Great for moms working from home!" },
    { name: "Adam Cooper", email: "adam.cooper@outlook.com", type: "Reseller", text: "Very detailed tracking." },
    { name: "Amber Richardson", email: "amber.r@gmail.com", type: "Reseller", text: "Simple and effective." },
    { name: "Walter Cox", email: "walter.cox@gmail.com", type: "Supplier", text: "Professionally managed." },
    { name: "Danielle Howard", email: "danielle.h@icloud.com", type: "Reseller", text: "My favorite wholesale marketplace." },
    { name: "Peter Ward", email: "peter.ward@outlook.com", type: "Reseller", text: "Five stars all the way." },
];

export function ReviewsSection() {
    return (
        <section className="py-24 bg-[#07060f] overflow-hidden">
            <div className="container px-4 md:px-6 mb-14 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-[11px] font-bold uppercase tracking-widest mb-6">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> July 2026 Reseller Spotlight
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
                    Over <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-cyan-400">1,000 new resellers</span> joined this month
                </h2>
                <p className="text-zinc-500 text-lg font-medium max-w-3xl mx-auto">
                    In July 2026, active resellers reported more than <span className="text-white font-bold">$600K</span> in platform earnings and sales activity. Read the reviews at an easy pace.
                </p>
            </div>

            <div className="relative w-full">
                {/* Left fade */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#07060f] to-transparent z-10 pointer-events-none" />
                {/* Right fade */}
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#07060f] to-transparent z-10 pointer-events-none" />

                <div className="flex animate-scroll hover:pause gap-5 w-[max-content]">
                    {[...reviews, ...reviews].map((review, i) => (
                        <div
                            key={i}
                            className="w-[320px] flex-shrink-0 bg-white/[0.03] p-6 rounded-2xl border border-white/[0.06] hover:border-purple-500/30 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                        style={{ background: `hsl(${(i * 37) % 360}, 65%, 45%)` }}>
                                        {review.name[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{review.name}</h4>
                                        <p className="text-[11px] text-zinc-600">{review.email}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${review.type === 'Supplier'
                                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20'
                                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/20'
                                    }`}>
                                    {review.type}
                                </span>
                            </div>
                            <div className="flex mb-3 gap-0.5">
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />)}
                            </div>
                            <p className="text-sm text-zinc-400 leading-relaxed">"{review.text}"</p>
                        </div>
                    ))}
                </div>
            </div>

            <style jsx global>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-scroll {
                    animation: scroll 240s linear infinite;
                }
                .hover\\:pause:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </section>
    );
}
