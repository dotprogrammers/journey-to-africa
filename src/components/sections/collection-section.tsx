"use client";

import { useEffect, useState } from "react";
import { FadeImage } from "@/components/fade-image";
import { getFallbackImage } from "@/lib/utils";

export function CollectionSection() {
	const [inclusions, setInclusions] = useState<any[]>([]);
	const [contentBlock, setContentBlock] = useState<any>(null);

	useEffect(() => {
		// Fetch items
		fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/features`, {
			headers: { 'Accept': 'application/json' }
		})
			.then(res => res.json())
			.then(json => {
				if (json.data && json.data.inclusions) {
					setInclusions(json.data.inclusions);
				}
			})
			.catch(err => console.error("Error fetching inclusions:", err));

		// Fetch section info
		fetch(`${process.env.NEXT_PUBLIC_API_URL}/cms/blocks`, {
			headers: { 'Accept': 'application/json' }
		})
			.then(res => res.json())
			.then(json => {
				if (json.data?.inclusions) {
					setContentBlock(json.data.inclusions[0]);
				}
			})
			.catch(err => console.error("Error fetching inclusion blocks:", err));
	}, []);

	const displayTitle = contentBlock?.title || "What’s Included";

	const displayInclusions = inclusions.length > 0 ? inclusions : [
		{
			title: "9 Nights Accommodation",
			description: "Premium stay in Ghana based on double occupancy.",
			image: "https://images.pexels.com/photos/4526407/pexels-photo-4526407.jpeg?auto=compress&cs=tinysrgb&w=800",
		},
		{
			title: "Daily Breakfast",
			description: "A smooth and reliable start to each day.",
			image: "https://images.pexels.com/photos/4498362/pexels-photo-4498362.jpeg?auto=compress&cs=tinysrgb&w=800",
		},
		{
			title: "Ground Transportation",
			description: "Private coordinated transport throughout the journey.",
			image: "https://images.pexels.com/photos/5807587/pexels-photo-5807587.jpeg?auto=compress&cs=tinysrgb&w=800",
		},
		{
			title: "Airport Transfers",
			description: "Arrival and departure support included.",
			image: "https://images.pexels.com/photos/7260250/pexels-photo-7260250.jpeg?auto=compress&cs=tinysrgb&w=800",
		},
		{
			title: "Historic Site Access",
			description: "Cape Coast, Elmina, and Assin Manso experiences included.",
			image: "https://images.pexels.com/photos/3077882/pexels-photo-3077882.jpeg?auto=compress&cs=tinysrgb&w=800",
		},
		{
			title: "Signature Events",
			description: "Juneteenth access, networking event, welcome dinner, farewell dinner, and professional group photos.",
			image: "https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=800",
		},
		{
			title: "Mosque Visit & Dialogue",
			description: "Meaningful cultural and spiritual engagement.",
			image: "https://images.pexels.com/photos/4498362/pexels-photo-4498362.jpeg?auto=compress&cs=tinysrgb&w=800",
		},
		{
			title: "Professional Group Photos",
			description: "High-quality visual keepsakes from the experience.",
			image: "https://images.pexels.com/photos/4526407/pexels-photo-4526407.jpeg?auto=compress&cs=tinysrgb&w=800",
		},
		{
			title: "Curated Group Experience",
			description: "Designed for purposeful travelers, not mass tourism.",
			image: "https://images.pexels.com/photos/5807587/pexels-photo-5807587.jpeg?auto=compress&cs=tinysrgb&w=800",
		},
	];
	return (
		<section id="inclusions" className="relative z-10 bg-background pt-20 md:pt-32">
			<div className="px-6 pb-20 md:px-12 lg:px-20 md:pb-10">
				<h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl mb-4">
					{displayTitle}
				</h2>
			</div>
			<div className="pb-24">
				<div className="grid grid-cols-1 gap-6 px-6 md:grid-cols-3 md:px-12 lg:px-20">
						{displayInclusions.map((item, idx) => (
							<div
								key={idx}
								className="group bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-1"
								style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)' }}
							>
								<div className="relative aspect-[2/3]">
									<FadeImage
										src={getFallbackImage(item.image_url || item.image, 'section')}
										alt={item.title}
										fill
										className="object-cover group-hover:scale-110 transition-transform duration-500"
									/>
								</div>
								<div className="py-6 px-4">
									<h3 className="text-lg font-extrabold text-foreground mb-2 font-serif tracking-tight group-hover:text-primary transition-colors duration-300">
										{item.title}
									</h3>
									<p className="text-sm text-muted-foreground">
										{item.description}
									</p>
								</div>
							</div>
						))}
				</div>
			</div>
		</section>
	);
}
