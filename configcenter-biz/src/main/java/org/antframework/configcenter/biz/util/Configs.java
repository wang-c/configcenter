/* 
 * 作者：钟勋 (e-mail:zhongxunking@163.com)
 */

/*
 * 修订记录:
 * @author 钟勋 2018-10-20 23:51 创建
 */
package org.antframework.configcenter.biz.util;

import org.antframework.boot.core.Contexts;
import org.antframework.common.util.facade.FacadeUtils;
import org.antframework.configcenter.facade.api.ConfigService;
import org.antframework.configcenter.facade.info.ReleaseInfo;
import org.antframework.configcenter.facade.order.FindAppSelfConfigOrder;
import org.antframework.configcenter.facade.result.FindAppSelfConfigResult;
import org.antframework.configcenter.facade.vo.Scope;

import java.util.List;

/**
 * 配置操作类
 */
public final class Configs {
    // 配置服务
    private static final ConfigService CONFIG_SERVICE = Contexts.getApplicationContext().getBean(ConfigService.class);

    /**
     * 查找应用自己的在指定环境中的配置
     *
     * @param appId     应用id
     * @param profileId 环境id
     * @param minScope  最小作用域
     * @param target    目标
     * @return 由近及远继承的所用环境中的配置
     */
    public static List<ReleaseInfo> findAppSelfConfig(String appId, String profileId, Scope minScope, String target) {
        FindAppSelfConfigOrder order = new FindAppSelfConfigOrder();
        order.setAppId(appId);
        order.setProfileId(profileId);
        order.setMinScope(minScope);
        order.setTarget(target);

        FindAppSelfConfigResult result = CONFIG_SERVICE.findAppSelfConfig(order);
        FacadeUtils.assertSuccess(result);
        return result.getInheritedReleases();
    }
}
