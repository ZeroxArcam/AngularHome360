// import { Component, OnInit, OnDestroy, inject } from '@angular/core';
// import { ListHomeComponent } from '../list-home/list-home.component';
// import { takeUntil, tap } from 'rxjs/operators';
// import { Router } from '@angular/router';
// import { ScheduleModalComponent } from '../schedule-modal/schedule-modal.component';
// import { TokenService } from '@app/core/services/auth/token.service';
// @Component({
//   selector: 'app-seller-homes-list',
//   templateUrl: './seller-homes-list.component.html',
//   styleUrls: ['./seller-homes-list.component.scss']
// })
// export class SellerHomesListComponent extends ListHomeComponent implements OnInit, OnDestroy {
//   private router = inject(Router);
//   private tokenService = inject(TokenService);
//   isScheduleModalVisible = false;
//   selectedHomeId: number | null = null;

//   override ngOnInit(): void {
//     super.ngOnInit();
//     this.loadSellerProperties();

//     this.filterForm.valueChanges.pipe(
//       tap(filters => {
//         const sellerId = this.tokenService.getUserId();
//         this.paginationParams.next({
//           ...this.paginationParams.value,
//           ...filters,
//           userId: sellerId ? parseInt(sellerId.toString(), 10) : null,
//           page: 0
//         });
//       }),
//       takeUntil(this.destroy$)
//     ).subscribe();

//     this.loadAllCategories();
//     this.loadAllLocations();
//   }

//   loadSellerProperties(): void {
//     const sellerId = this.tokenService.getUserId();
//     if (sellerId) {
//       this.paginationParams.next({
//         ...this.paginationParams.value,
//         userId: parseInt(sellerId.toString(), 10),
//         page: 0
//       });
//     }
//   }

//   openScheduleModal(homeId: number): void {
//     this.selectedHomeId = homeId;
//     this.isScheduleModalVisible = true;
//   }
//   closeScheduleModal(): void {
//     this.isScheduleModalVisible = false;
//     this.selectedHomeId = null;
//   }

//   override ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//     super.ngOnDestroy();
//   }
// }

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ListHomeComponent } from '../list-home/list-home.component';
import { takeUntil, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ScheduleModalComponent } from '../schedule-modal/schedule-modal.component';
import { TokenService } from '@app/core/services/auth/token.service';
@Component({
  selector: 'app-seller-homes-list',
  templateUrl: './seller-homes-list.component.html',
  styleUrls: ['./seller-homes-list.component.scss']
})
export class SellerHomesListComponent extends ListHomeComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private tokenService = inject(TokenService);
  isScheduleModalVisible = false;
  selectedHomeId: number | null = null;

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadSellerProperties();

    this.filterForm.valueChanges.pipe(
      tap(filters => {
        const sellerId = this.tokenService.getUserId();
        this.paginationParams.next({
          ...this.paginationParams.value,
          ...filters,
          userId: sellerId ? parseInt(sellerId.toString(), 10) : null,
          page: 0
        });
      }),
      takeUntil(this.destroy$)
    ).subscribe();

    this.loadAllCategories();
    this.loadAllLocations();
  }

  loadSellerProperties(): void {
    const sellerId = this.tokenService.getUserId();
    if (sellerId) {
      this.paginationParams.next({
        ...this.paginationParams.value,
        userId: parseInt(sellerId.toString(), 10),
        page: 0
      });
    }
  }

  openScheduleModal(homeId: number): void {
    this.selectedHomeId = homeId;
    this.isScheduleModalVisible = true;
  }
  closeScheduleModal(): void {
    this.isScheduleModalVisible = false;
    this.selectedHomeId = null;
  }

  override ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    super.ngOnDestroy();
  }
}
