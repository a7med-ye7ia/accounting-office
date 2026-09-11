package com.accounting.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@SpringBootApplication
@EnableAsync
public class BackendApplication {

	@Bean(name = "embeddingIndexExecutor")
	public ThreadPoolTaskExecutor embeddingIndexExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(1);
		executor.setMaxPoolSize(2);
		executor.setQueueCapacity(10);
		executor.setThreadNamePrefix("embedding-index-");
		executor.initialize();
		return executor;
	}


	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}
}
