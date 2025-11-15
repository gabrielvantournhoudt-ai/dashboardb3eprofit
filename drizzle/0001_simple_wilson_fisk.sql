CREATE TABLE `analises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`dataInicio` timestamp NOT NULL,
	`dataFim` timestamp NOT NULL,
	`totalDias` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `analises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `b3_fluxo_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`data` timestamp NOT NULL,
	`tipoInvestidor` varchar(100) NOT NULL,
	`comprasAcumuladoMil` int NOT NULL,
	`vendasAcumuladoMil` int NOT NULL,
	`fluxoAcumuladoMil` int NOT NULL,
	`comprasDiarioMil` int,
	`vendasDiarioMil` int,
	`fluxoDiarioMil` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `b3_fluxo_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `winfut_cotacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`data` timestamp NOT NULL,
	`abertura` int NOT NULL,
	`maxima` int NOT NULL,
	`minima` int NOT NULL,
	`fechamento` int NOT NULL,
	`volumeTotal` int NOT NULL,
	`quantidadeTotal` int NOT NULL,
	`variacaoPontos` int,
	`variacaoPct` int,
	`amplitude` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `winfut_cotacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `analises` ADD CONSTRAINT `analises_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `b3_fluxo_data` ADD CONSTRAINT `b3_fluxo_data_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `winfut_cotacoes` ADD CONSTRAINT `winfut_cotacoes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;