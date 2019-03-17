/* 
 * 作者：钟勋 (e-mail:zhongxunking@163.com)
 */

/*
 * 修订记录:
 * @author 钟勋 2018-08-14 01:02 创建
 */
package org.antframework.configcenter.spring.boot;

import org.antframework.configcenter.spring.context.Contexts;
import org.hibernate.validator.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import javax.validation.constraints.Min;

/**
 * 配置中心属性
 */
@ConfigurationProperties("configcenter")
@Validated
public class ConfigcenterProperties {
    /**
     * 应用id（默认为spring.application.name对应的配置）
     */
    public static final String APP_ID_PATTERN = "${configcenter.app-id:${spring.application.name}}";
    /**
     * 是否开启监听配置变更事件（默认为开启）
     */
    public static final String LISTEN_CONFIGS_ENABLE_KEY = "configcenter.listen-configs.enable";
    /**
     * 实例
     */
    public static final ConfigcenterProperties INSTANCE = Contexts.buildProperties(ConfigcenterProperties.class);

    /**
     * 必填：配置中心服务端地址（比如：http://192.168.0.1:6220）
     */
    @NotBlank
    private String serverUrl;
    /**
     * 选填：缓存目录（默认为：/var/apps/configcenter）
     */
    @NotBlank
    private String cacheDirPath = "/var/apps/configcenter";
    /**
     * 选填：配置刷新周期（单位：秒。默认为5分钟刷新一次）
     */
    @Min(1)
    private int refreshPeriod = 5 * 60;
    /**
     * 选填：配置中心的配置优先于指定的配置源（默认为最低优先级）。可填入：commandLineArgs（命令行）、systemProperties（系统属性）、systemEnvironment（系统环境）、applicationConfigurationProperties（配置文件）等等
     */
    private String priorTo = null;

    public String getServerUrl() {
        return serverUrl;
    }

    public void setServerUrl(String serverUrl) {
        this.serverUrl = serverUrl;
    }

    public String getCacheDirPath() {
        return cacheDirPath;
    }

    public void setCacheDirPath(String cacheDirPath) {
        this.cacheDirPath = cacheDirPath;
    }

    public int getRefreshPeriod() {
        return refreshPeriod;
    }

    public void setRefreshPeriod(int refreshPeriod) {
        this.refreshPeriod = refreshPeriod;
    }

    public String getPriorTo() {
        return priorTo;
    }

    public void setPriorTo(String priorTo) {
        this.priorTo = priorTo;
    }
}
