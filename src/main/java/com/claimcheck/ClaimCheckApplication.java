package com.claimcheck;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * ClaimCheck: a local educational prototype. All rules are fictional and all data should be synthetic.
 */
@SpringBootApplication
public class ClaimCheckApplication {

    private static final Logger log = LoggerFactory.getLogger(ClaimCheckApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(ClaimCheckApplication.class, args);
        log.info("ClaimCheck is a local educational prototype. Rules are fictional. Use synthetic data only.");
    }
}
