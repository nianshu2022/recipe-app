package com.nianshu.recipeapp;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 禁止全屏模式，确保内容在状态栏下方
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        
        // 设置状态栏颜色
        getWindow().setStatusBarColor(0xFFA8432D); // colorPrimaryDark
    }
}
