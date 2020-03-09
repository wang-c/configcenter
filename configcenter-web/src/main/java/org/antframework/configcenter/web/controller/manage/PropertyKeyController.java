/* 
 * 作者：钟勋 (e-mail:zhongxunking@163.com)
 */

/*
 * 修订记录:
 * @author 钟勋 2017-09-15 11:23 创建
 */
package org.antframework.configcenter.web.controller.manage;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.antframework.common.util.facade.AbstractResult;
import org.antframework.common.util.facade.EmptyResult;
import org.antframework.common.util.facade.FacadeUtils;
import org.antframework.common.util.tostring.ToString;
import org.antframework.configcenter.biz.util.Apps;
import org.antframework.configcenter.biz.util.PropertyKeys;
import org.antframework.configcenter.facade.api.PropertyKeyService;
import org.antframework.configcenter.facade.info.AppInfo;
import org.antframework.configcenter.facade.info.PropertyKeyInfo;
import org.antframework.configcenter.facade.order.AddOrModifyPropertyKeyOrder;
import org.antframework.configcenter.facade.order.DeletePropertyKeyOrder;
import org.antframework.configcenter.facade.vo.Scope;
import org.antframework.configcenter.web.common.ManagerApps;
import org.antframework.configcenter.web.common.OperatePrivileges;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * 配置key管理controller
 */
@RestController
@RequestMapping("/manage/propertyKey")
@AllArgsConstructor
public class PropertyKeyController {
    // 配置key服务
    private final PropertyKeyService propertyKeyService;

    /**
     * 新增或修改配置key
     *
     * @param appId 应用id
     * @param key   key
     * @param scope 作用域
     * @param memo  备注
     */
    @RequestMapping("/addOrModifyPropertyKey")
    public EmptyResult addOrModifyPropertyKey(String appId, String key, Scope scope, String memo) {
        ManagerApps.adminOrHaveApp(appId);
        OperatePrivileges.adminOrReadWrite(appId, key);
        AddOrModifyPropertyKeyOrder order = new AddOrModifyPropertyKeyOrder();
        order.setAppId(appId);
        order.setKey(key);
        order.setScope(scope);
        order.setMemo(memo);

        return propertyKeyService.addOrModifyPropertyKey(order);
    }

    /**
     * 删除配置key
     *
     * @param appId 应用id
     * @param key   key
     */
    @RequestMapping("/deletePropertyKey")
    public EmptyResult deletePropertyKey(String appId, String key) {
        ManagerApps.adminOrHaveApp(appId);
        OperatePrivileges.adminOrReadWrite(appId, key);
        DeletePropertyKeyOrder order = new DeletePropertyKeyOrder();
        order.setAppId(appId);
        order.setKey(key);

        return propertyKeyService.deletePropertyKey(order);
    }

    /**
     * 查找应用继承的配置key（包含应用自己）
     *
     * @param appId 应用id
     */
    @RequestMapping("/findInheritedPropertyKeys")
    public FindInheritedPropertyKeysResult findInheritedPropertyKeys(String appId) {
        ManagerApps.adminOrHaveApp(appId);

        FindInheritedPropertyKeysResult result = FacadeUtils.buildSuccess(FindInheritedPropertyKeysResult.class);
        for (AppInfo app : Apps.findInheritedApps(appId)) {
            List<PropertyKeyInfo> propertyKeys = PropertyKeys.findPropertyKeys(app.getAppId(), Scope.PRIVATE);
            result.addAppPropertyKey(new FindInheritedPropertyKeysResult.AppPropertyKey(app, propertyKeys));
        }
        return result;
    }

    /**
     * 查找应用继承的所有应用的配置key
     */
    @Getter
    public static class FindInheritedPropertyKeysResult extends AbstractResult {
        // 由近及远继承的所用应用的配置key
        private final List<AppPropertyKey> appPropertyKeys = new ArrayList<>();

        public void addAppPropertyKey(AppPropertyKey appPropertyKey) {
            appPropertyKeys.add(appPropertyKey);
        }

        /**
         * 应用的配置key
         */
        @AllArgsConstructor
        @Getter
        public static final class AppPropertyKey implements Serializable {
            // 应用
            private final AppInfo app;
            // 所有的配置key
            private final List<PropertyKeyInfo> propertyKeys;

            @Override
            public String toString() {
                return ToString.toString(this);
            }
        }
    }
}
