//
//  OwasNlpIntegrationApp.swift
//  OwasNlpIntegration
//
//  Created by Mathieu Monney on 26/07/2022.
//

import SwiftUI
import OwasNlp
import PrivatelyCoreIos

final class AppModel: ObservableObject {
    func initialize() {
        if !PrivatelyCore.sharedInstance().isAuthenticated() {
            PrivatelyCore.sharedInstance().authenticate(apiKey: "f6c90326-1cee-40fd-9dd9-d8ada6873449", apiSecret: "SjdGcae-17rNBCnQV1hvYFcWj0v037", callback: { result in
                self.initializeSDK()
            })
        } else {
            initializeSDK()
        }
    }
    
    private func initializeSDK() {
        SensitiveInfoAnalyzer.sharedInstance().initManager()
        do {
            try HateSpeechAnalyzer.sharedInstance().initManager()
            try ToxicityAnalyzer.sharedInstance().initManager()
            
        } catch {
            print(error)
        }
    }
}

@main
struct OwasNlpIntegrationApp: App {
    @StateObject private var model = AppModel()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onAppear() {
                    model.initialize()
                }
        }
    }
    
    
}
