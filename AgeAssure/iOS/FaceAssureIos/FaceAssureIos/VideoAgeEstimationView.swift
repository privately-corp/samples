//
//  VideoAgeEstimationView.swift
//  FaceAssureIos
//
//  Created by Mathieu Monney on 18/09/2023.
//

import SwiftUI
import PrivatelyCoreIos
import AgeEstimationImage


struct VideoAgeEstimation: View, AgeEstimationListener {
    func onAgeEstimated(ageEstimationResult: AgeEstimationImage.ImageAgeEstimationResult) {
        print("Estimated age range: \(ageEstimationResult.getAgeRange())")
    }

    func onImageProcessed(imageProcessedCount: Int, maxImageCount: Int) {
        print("Captured \(imageProcessedCount) of \(maxImageCount) images")
    }

    @StateObject private var viewModel = ViewModel()
    
    var view: some View {
        let recorderView = VideoRecorderView(
            isLivenessEnabled: true,
            isHeadOrientationEnabled: true,
            isMinFaceSizeEnabled: true,
            isHeadOverlayEnabled: true,
            minImageCount: 5
        )

        AgeEstimationImageMain.sharedInstance().addCallback(callback: self)

        return recorderView
    }

    var body: some View {
        if viewModel.isAuthenticated {
            view
        } else {
            ProgressView().onAppear(perform: {
                self.initSdk()
            })
        }
    }

    func initSdk() {
        if !viewModel.isAuthenticated {
            viewModel.authenticateSdk()
        } else {
            print("Authenticated")
        }
    }
}

extension VideoAgeEstimation {
    class ViewModel: ObservableObject {
        let apiKey = "" // Your API key
        let apiSecret = "" // Your API secret
        
        @Published var isAuthenticated = false
        
        func authenticateSdk() {
            PrivatelyCore.sharedInstance().authenticate(apiKey: apiKey, apiSecret: apiSecret, callback: { result in
                DispatchQueue.main.async{
                    self.isAuthenticated = true
                }
            })
        }
    }
}
