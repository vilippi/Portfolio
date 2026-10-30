import React from 'react';
import { cn } from '@/lib/utils';
import {
	LucideIcon,
	PlusIcon,
} from 'lucide-react';

// Componente do 21st.dev, com três ajustes para este projeto: o título é um
// h2 com id (a página já tem um h1 e o diálogo usa ele como rótulo); as
// superfícies discretas usam `secondary` (aqui `muted` é cor de texto); e as
// bordas têm cor explícita (no Tailwind 4 a borda sem cor usa a do texto).

type ContactInfoProps = React.ComponentProps<'div'> & {
	icon: LucideIcon;
	label: string;
	value: string;
};

type ContactCardProps = React.ComponentProps<'div'> & {
	// Content props
	title?: string;
	titleId?: string;
	description?: string;
	contactInfo?: ContactInfoProps[];
	formSectionClassName?: string;
};

export function ContactCard({
	title = 'Contact With Us',
	titleId,
	description = 'If you have any questions regarding our Services or need help, please fill out the form here. We do our best to respond within 1 business day.',
	contactInfo,
	className,
	formSectionClassName,
	children,
	...props
}: ContactCardProps) {
	return (
		<div
			className={cn(
				'bg-card border-border border relative grid h-full w-full shadow md:grid-cols-2 lg:grid-cols-3', // taste-skill-ignore: desenho do componente escolhido; aqui ele é um diálogo
				className,
			)}
			{...props}
		>
			<PlusIcon className="absolute -top-3 -left-3 h-6 w-6" />
			<PlusIcon className="absolute -top-3 -right-3 h-6 w-6" />
			<PlusIcon className="absolute -bottom-3 -left-3 h-6 w-6" />
			<PlusIcon className="absolute -right-3 -bottom-3 h-6 w-6" />
			<div className="flex flex-col justify-between lg:col-span-2">
				<div className="relative h-full space-y-4 px-4 py-8 md:p-8">
					<h2 id={titleId} className="text-3xl font-bold md:text-4xl lg:text-5xl">
						{title}
					</h2>
					<p className="text-muted-foreground max-w-xl text-sm md:text-base lg:text-lg">
						{description}
					</p>
					<div className="grid gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
						{contactInfo?.map((info, index) => (
							<ContactInfo key={index} {...info} />
						))}
					</div>
				</div>
			</div>
			<div
				className={cn(
					'bg-secondary border-border flex h-full w-full items-center border-t p-5 md:col-span-1 md:border-t-0 md:border-l', // taste-skill-ignore: desenho do componente escolhido
					formSectionClassName,
				)}
			>
				{children}
			</div>
		</div>
	);
}

function ContactInfo({
	icon: Icon,
	label,
	value,
	className,
	...props
}: ContactInfoProps) {
	return (
		<div className={cn('flex items-center gap-3 py-3', className)} {...props}>
			<div className="bg-secondary rounded-lg p-3">
				<Icon className="h-5 w-5" />
			</div>
			<div>
				<p className="font-medium">{label}</p>
				<p className="text-muted-foreground text-xs">{value}</p>
			</div>
		</div>
	);
}
